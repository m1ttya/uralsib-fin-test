import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_URL || '';
  const [state, setState] = useState<'checking' | 'unauth' | 'authed'>('checking');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const loginInputRef = useRef<HTMLInputElement>(null);

  const checkMe = async () => {
    try {
      setError(null);
      const baseUrl = API_BASE?.replace(/\/+$/, '') || '';
      const res = await fetch(`${baseUrl}/api/auth/me`, { credentials: 'include' });
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
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    checkMe();
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (state === 'unauth' && loginInputRef.current) {
      loginInputRef.current.focus();
    }
  }, [state]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const baseUrl = API_BASE?.replace(/\/+$/, '') || '';
      const res = await fetch(`${baseUrl}/api/auth/login`, {
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

  if (isMobile) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-red-600">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Доступ с мобильных устройств ограничен</h2>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">
            Административная панель доступна только на компьютере или планшете с экраном шире 768 пикселей.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-lg bg-primary text-white hover:bg-secondary transition-colors font-medium"
          >
            На главную
          </button>
        </div>
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
            <input ref={loginInputRef} value={login} onChange={e=>setLogin(e.target.value)} type="text" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30" required />
          </label>
          <label className="block mb-4">
            <div className="text-sm text-gray-600 mb-1">Пароль</div>
            <input value={password} onChange={e=>setPassword(e.target.value)} type="password" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif', fontSize: '16px' }} />
          </label>
          {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
          <button type="submit" className="w-full py-2.5 rounded-lg bg-primary text-white hover:bg-secondary transition-colors">Войти</button>
          <button type="button" onClick={()=> navigate('/')} className="w-full py-2.5 rounded-lg mt-2 bg-gray-100 hover:bg-gray-200 text-gray-700">Назад</button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
