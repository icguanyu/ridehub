// Step 7 佔位頁；Step 8-9 會逐一實作。
export default function Stub({ title, note }) {
  return (
    <div className="card">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">{note || '此頁面尚待實作。'}</p>
    </div>
  );
}
