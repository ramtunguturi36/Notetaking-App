export function ChatBox({ question, answer, loading = false, onQuestionChange, onAsk }) {
  const disabled = loading

  return (
    <div className="chat-box">
      <h4>Chat with Your Notes</h4>
      <input
        value={question}
        disabled={disabled}
        onChange={(event) => onQuestionChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !disabled) {
            onAsk()
          }
        }}
        placeholder="What did I decide about graph view?"
      />
      <button onClick={onAsk} disabled={disabled}>{loading ? 'Asking...' : 'Ask'}</button>
      <p aria-live="polite">{answer}</p>
    </div>
  )
}