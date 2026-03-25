export default function Message({ sender, text }) {
  return (
    <p style={{ color: sender === "user" ? "blue" : "green" }}>
      <b>{sender === "user" ? "You" : "AI"}:</b> {text}
    </p>
  );
}