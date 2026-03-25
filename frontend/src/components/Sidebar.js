export default function Sidebar({
  conversations,
  currentId,
  onSelect,
  onNew
}) {
  return (
    <div style={{ width: 220, borderRight: "1px solid #ccc", padding: 10 }}>
      <button onClick={() => { console.log("CLICKED BUTTON"); onNew(); }}>+ New Chat</button>

      <h3>Conversations</h3>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {Array.isArray(conversations) && conversations.map(c => (
          <li
            key={c.id}
            onClick={() => onSelect(c.id)}
            style={{
              padding: 6,
              cursor: "pointer",
              borderRadius: 4,
              background:
                c.id === currentId ? "#ddd" : "transparent"
            }}
          >
            {c.title || `Conversation ${c.id}`}
          </li>
        ))}
      </ul>
    </div>
  );
}