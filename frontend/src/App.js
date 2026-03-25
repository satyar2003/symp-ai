import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Chat from "./components/Chat";

export default function App() {
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const API = "https://symp-ai.onrender.com"; // <-- update this

  /* ---------- Load Conversations ---------- */
  async function loadConversations() {
    const res = await fetch(`${API}/conversations`);
    const data = await res.json();
    setConversations(data);
  }

  useEffect(() => {
    loadConversations();
  }, []);

  /* ---------- New Conversation ---------- */
  async function newConversation() {
    const res = await fetch(`${API}/conversation`, { method: "POST" });
    const data = await res.json();

    setCurrentConversationId(data.conversation_id);
    setMessages([]);
    loadConversations();
  }

  /* ---------- Select Conversation ---------- */
  async function selectConversation(id) {
    setCurrentConversationId(id);

    const res = await fetch(`${API}/messages/${id}`);
    const data = await res.json();

    setMessages(data);
  }

  /* ---------- Send Message ---------- */
  async function sendMessage(text) {
    if (!currentConversationId) {
      alert("Create or select a conversation first");
      return;
    }

    setMessages(prev => [...prev, { sender: "user", content: text }]);
    setIsTyping(true);

    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: text,
          conversation_id: currentConversationId
        })
      });

      const data = await res.json();

      setMessages(prev => [
        ...prev,
        { sender: "bot", content: data.reply }
      ]);

      loadConversations();
    } catch {
      setMessages(prev => [
        ...prev,
        { sender: "bot", content: "Error contacting server" }
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar
        conversations={conversations}
        currentId={currentConversationId}
        onSelect={selectConversation}
        onNew={newConversation}
      />

      <Chat
        messages={messages}
        onSend={sendMessage}
        isTyping={isTyping}
      />
    </div>
  );
}