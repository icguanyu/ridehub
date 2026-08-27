export default function Spinner({ label = '載入中…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-slate-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-500" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
