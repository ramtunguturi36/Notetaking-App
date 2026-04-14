export function ChatBox({ question, answer, onQuestionChange, onAsk }) {
  return (
    <div className="chat-box">
      <h4>Chat with Your Notes</h4>
      <input
        value={question}
        onChange={(event) => onQuestionChange(event.target.value)}
        placeholder="What did I decide about graph view?"
      />
      <button onClick={onAsk}>Ask</button>
      <p>{answer}</p>
    </div>
  )
}