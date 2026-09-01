export default function ToastContainer({ toasts = [] }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => {
        return (
          <div key={t.id} className={`toast ${t.type ? `toast--${t.type}` : ''}`}>
            <span>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
