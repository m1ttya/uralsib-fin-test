import { useEffect, useState } from 'react';

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'checking' | 'unauth' | 'authed'>('checking');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const checkMe = async () => {
    try {
      setError(null);
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        setState('authed');
      } else {
        setState('unauth');
      }
    } catch {
      setState('unauth');
    }
  };

  useEffect(() => {
    checkMe();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ login, password })
      });
      if (res.ok) {
        setState('authed');
      } else {
        setError('Неверный логин или пароль');
      }
    } catch (e) {
      setError('Сеть недоступна');
    }
  };

  if (state === 'checking') {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-gray-500">Проверка доступа…</div>
      </div>
    );
  }

  if (state === 'unauth') {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50">
        <form onSubmit={onSubmit} className="w-[min(90%,360px)] bg-white p-6 rounded-2xl shadow border border-gray-100">
          <div className="text-center text-xl font-bold text-primary mb-4">Вход для админов</div>
          <label className="block mb-3">
            <div className="text-sm text-gray-600 mb-1">Логин</div>
            <input value={login} onChange={e=>setLogin(e.target.value)} type="text" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30" required />
          </label>
          <label className="block mb-4">
            <div className="text-sm text-gray-600 mb-1">Пароль</div>
            <input value={password} onChange={e=>setPassword(e.target.value)} type="password" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif' }} />
          </label>
          {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
          <button type="submit" className="w-full py-2.5 rounded-lg bg-primary text-white hover:bg-secondary transition-colors">Войти</button>
          <button type="button" onClick={()=>{ window.location.hash = ''; }} className="w-full py-2.5 rounded-lg mt-2 bg-gray-100 hover:bg-gray-200 text-gray-700">Назад</button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
