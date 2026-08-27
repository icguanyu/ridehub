import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <div className="text-5xl font-bold text-slate-300">404</div>
      <p className="mt-3 text-slate-600">找不到這個頁面</p>
      <Link to="/" className="btn-primary mt-6">
        回首頁
      </Link>
    </div>
  );
}
