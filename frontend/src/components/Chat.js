import { useState, useRef, useEffect } from "react";
import Message from "./Messages";

export default function Chat({ messages, onSend, isTyping }) {
  const [input, setInput] = useState("");
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  function handleSend() {
    const text = input.trim();
    if (!text) return;

    onSend(text);
    setInput("");
  }

  function handleKey(e) {
    if (e.key === "Enter") {
      handleSend();
    }
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 10 }}>
      <h2>Health Assistant</h2>

      <div
        ref={chatRef}
        style={{
          flex: 1,
          border: "1px solid black",
          padding: 10,
          overflowY: "auto"
        }}
      >
        {messages.map((m, i) => (
          <Message key={i} sender={m.sender} text={m.content} />
        ))}

        {isTyping && (
          <p style={{ fontStyle: "italic", color: "#666" }}>
            AI is typing…
          </p>
        )}
      </div>

      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Describe your symptom..."
          style={{ flex: 1, padding: 6 }}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}