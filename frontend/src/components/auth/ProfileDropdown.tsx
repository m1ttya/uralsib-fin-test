import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface User {
  name: string;
  email: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface ProfileDropdownProps {
  user: User;
}

export default function ProfileDropdown({ user }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  const getDisplayName = () => {
    if (user.name) return user.name;
    if (user.username) return user.username;
    if (user.email) return user.email;
    return 'Пользователь';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Открыть меню профиля"
        title={getDisplayName()}
        style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
      >
        {user.avatar_url ? (
          <div className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <img
              src={user.avatar_url}
              alt="Аватар"
              className="w-[18px] h-[18px] rounded-full object-cover"
            />
          </div>
        ) : (
          <div className="p-2 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <span className="text-white font-semibold text-sm w-[18px] h-[18px] flex items-center justify-center">
              {getDisplayName().charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mr-2 mt-2 w-56 sm:w-64 md:w-72 rounded-lg shadow-lg z-50 overflow-hidden"
            style={{
              backgroundColor: '#3B175C',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="p-3 border-b border-white/10">
              <p className="text-white font-semibold truncate" title={getDisplayName()}>{getDisplayName()}</p>
              <p className="text-white/60 text-sm truncate" title={user.email || user.username || 'Пользователь'}>
                {user.email || user.username || 'Пользователь'}
              </p>
            </div>

            <div className="py-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/cabinet');
                }}
                className="w-full text-left px-4 py-2 text-white hover:bg-white/10 transition-colors flex items-center space-x-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Личный кабинет</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-white hover:bg-white/10 transition-colors flex items-center space-x-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Выйти</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
