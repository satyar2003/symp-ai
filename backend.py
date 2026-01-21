import os
from fastapi import FastAPI, Body
from contextlib import asynccontextmanager
from pydantic import BaseModel
from openai import OpenAI
import nltk
from nltk.tokenize import word_tokenize
from nltk import pos_tag, RegexpParser
from fastapi.middleware.cors import CORSMiddleware
from database import init_db, get_db
from dotenv import load_dotenv

# --- Setup ---
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
DB_NAME = "chat.db"

# --- NLTK ---
nltk.download("punkt")
nltk.download("punkt_tab")
nltk.download("averaged_perceptron_tagger")
nltk.download("averaged_perceptron_tagger_eng")

with open('wordlist.txt') as f:
    SYMPTOM_KEYWORDS = [line.rstrip() for line in f]

grammar = r"""
    SYMP: {<JJ.*>*<NN.*>*<SYM>}
"""

def extract_symptom_phrases(text):
    tokens = word_tokenize(text.lower())
    tagged = pos_tag(tokens)

    tagged_sym = [
        (w, "SYM") if w in SYMPTOM_KEYWORDS else (w, p) for w, p in tagged
    ]

    tree = RegexpParser(grammar).parse(tagged_sym)

    return [
        " ".join(w for w, _ in s.leaves()) for s in tree.subtrees(lambda t: t.label() == "SYMP")
    ]

# --- API Schema ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🔹 Initializing database...")
    init_db()
    yield
    print("🔹 Shutting down application")

app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ok for local dev
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    conversation_id: int

@app.get("/")
async def root():
    return {"message": "Hello world"}

@app.post("/conversation")
def create_conversation():
    init_db()
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO conversations (title) VALUES (?)",
        ("New Conversation",)
    )

    conversation_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {"conversation_id": conversation_id}

@app.post("/chat")
def chat(req: ChatRequest):
    user_message = req.message
    symptoms = extract_symptom_phrases(user_message)
    conversation_id = req.conversation_id

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO messages (conversation_id, sender, content) VALUES (?, ?, ?)",
        (conversation_id, "user", user_message)
    )

    cursor.execute(
        """
        SELECT COUNT(*)
        FROM messages
        WHERE conversation_id = ? AND sender = 'user'
        """,
        (conversation_id,)
    )
    user_message_count = cursor.fetchone()[0]

    if user_message_count == 1:
        new_title = generate_title(user_message)
        cursor.execute(
            "UPDATE conversations SET title = ? WHERE id = ?",
            (new_title, conversation_id)
        )


    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a medical assistant. Do not diagnose. Ask follow up questions and give suggestions on what can be done."},
            {
                "role": "user",
                "content": f"User said: {req.message}\nExtracted symptoms: {symptoms}"
            }
        ]
    )

    bot_reply = f"{response.choices[0].message.content}"
    cursor.execute(
        "INSERT INTO messages (conversation_id, sender, content) VALUES (?, ?, ?)",
        (conversation_id, "bot", bot_reply)
    )

    conn.commit()
    conn.close()

    return {"reply": bot_reply}
def generate_title(text: str) -> str:
    words = text.split()
    return " ".join(words[:5]) + ("…" if len(words) > 5 else "")

@app.get("/conversations")
def get_conversations():
    conn = get_db()
    cursor = conn.cursor()

    rows = cursor.execute("""
        SELECT id, title, created_at
        FROM conversations
        ORDER BY created_at DESC
    """).fetchall()

    conn.close()
    return [dict(row) for row in rows]

@app.get("/messages/{conversation_id}")
def get_messages(conversation_id: int):
    conn = get_db()
    cursor = conn.cursor()

    rows = cursor.execute("""
        SELECT sender, content, timestamp
        FROM messages
        WHERE conversation_id = ?
        ORDER BY timestamp
    """, (conversation_id,)).fetchall()

    conn.close()
    return [dict(row) for row in rows]