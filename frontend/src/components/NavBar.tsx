import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import ProfileDropdown from './auth/ProfileDropdown';

const DEBUG_VERSION = (() => {
  try {
    const d = new Date();
    const pad = (n:number)=>String(n).padStart(2,'0');
    return `DBG-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  } catch { return 'DBG-unknown'; }
})();

const links = [
  { href: '#home', label: 'Главная' },
  { href: '#tests', label: 'Для кого' },
  { href: '#training', label: 'Обучение' },
  { href: '#about', label: 'О нас' },
  { href: '#game', label: 'Игра' },
];

export default function NavBar({ onShowLoginModal }: { onShowLoginModal: () => void }) {
  const { isAuthenticated, user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [canHover, setCanHover] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const menuBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener('scroll', onScroll);
    // detect hover capability (desktop)
    const mql = window.matchMedia('(hover: hover) and (pointer: fine)');
    const updateHover = () => setCanHover(mql.matches);
    updateHover();
    if (mql.addEventListener) mql.addEventListener('change', updateHover);
    else if ((mql as any).addListener) (mql as any).addListener(updateHover);
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (mql.removeEventListener) mql.removeEventListener('change', updateHover);
      else if ((mql as any).removeListener) (mql as any).removeListener(updateHover);
    };
  }, []);

  // Close mobile menu on wider screens and on Escape
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onHash = () => setOpen(false);
    const onTouchOutside = (e: TouchEvent) => {
      if (!open) return;
      const target = e.target as Node;
      const headerEl = headerRef.current;
      if (headerEl && !headerEl.contains(target)) {
        setOpen(false);
        menuBtnRef.current?.blur();
      }
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', onHash);
    window.addEventListener('touchstart', onTouchOutside, { passive: true });
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('touchstart', onTouchOutside as EventListener);
    };
  }, [open]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setOpen(false);
    // Update hash without default jump
    if (window.location.hash !== href) {
      window.history.replaceState(null, '', href);
    }
    // Defer scrolling until after layout updates (menu collapsed, header height settled)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const id = href.replace('#', '');
        const target = document.getElementById(id);
        if (!target) return;
        const topBarH = (document.getElementById('navbar-inner')?.offsetHeight ?? 64);
        const collapsedHeaderH = headerRef.current?.offsetHeight ?? topBarH;
        const extraGap = canHover ? 12 : 0; // desktop keeps small visual gap, mobile exact align
        const headerH = collapsedHeaderH + extraGap;
        const rect = target.getBoundingClientRect();
        const y = rect.top + window.scrollY - headerH;
        window.scrollTo({ top: y, behavior: 'smooth' });
      });
    });
  };
  return (
    <motion.header
        ref={headerRef}
        className="sticky top-3 z-50 w-[min(1180px,94%)] mx-auto rounded-2xl border border-white/40 relative pointer-events-auto backdrop-blur backdrop-saturate-150"
        style={{ backdropFilter: 'saturate(1.5) blur(6px)', WebkitBackdropFilter: 'saturate(1.5) blur(6px)' }}
        initial={{ backgroundColor: 'rgba(255,255,255,0.35)', boxShadow: '0 0 0 rgba(0,0,0,0)' }}
        animate={{
          backgroundColor: scrolled ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.40)',
          boxShadow: scrolled ? '0px 12px 36px rgba(0,0,0,0.18)' : '0px 2px 8px rgba(0,0,0,0.04)',
          borderBottomLeftRadius: '16px',
          borderBottomRightRadius: '16px',
          borderBottomWidth: '1px'
        }}
        transition={{
          backgroundColor: { duration: 0.16, ease: 'easeOut' },
          boxShadow: { duration: 0.16, ease: 'easeOut' },
          borderBottomLeftRadius: { duration: 0.18, ease: [0.22, 0.8, 0.36, 1] },
          borderBottomRightRadius: { duration: 0.18, ease: [0.22, 0.8, 0.36, 1] },
          borderBottomWidth: { duration: 0.18, ease: [0.22, 0.8, 0.36, 1] }
        }}
      > 
      <div className="flex items-center justify-between px-4 py-3" id="navbar-inner">
        <a href="#home" className="flex items-center gap-2">
          <img src={`${import.meta.env.BASE_URL}uralsib_logo.svg`} alt="Уралсиб" className="h-8 w-auto"/>
        </a>
        <nav className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <a key={l.href} href={l.href} onClick={(e)=>handleNavClick(e, l.href)} className="text-base text-gray-700 hover:text-primary transition-colors">{l.label}</a>
          ))}
          {isAuthenticated && user ? (
            <ProfileDropdown user={user} />
          ) : (
            <button
              onClick={onShowLoginModal}
              className="p-2 rounded-full bg-primary text-white hover:bg-secondary transition-colors"
              aria-label="Войти"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5Zm0 2c-3.866 0-7 3.134-7 7h2a5 5 0 0 1 10 0h2c0-3.866-3.134-7-7-7Z" fill="currentColor"/>
              </svg>
            </button>
          )}
        </nav>
        <div className="md:hidden flex items-center gap-2">
          {isAuthenticated && user ? (
            <ProfileDropdown user={user} />
          ) : (
            <button
              onClick={onShowLoginModal}
              className="p-2 rounded-full bg-primary text-white hover:bg-secondary transition-colors"
              aria-label="Войти"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5Zm0 2c-3.866 0-7 3.134-7 7h2a5 5 0 0 1 10 0h2c0-3.866-3.134-7-7-7Z" fill="currentColor"/>
              </svg>
            </button>
          )}
          <button
            ref={menuBtnRef}
            onClick={() => setOpen(v => !v)}
            onMouseUp={(e) => (e.currentTarget as HTMLButtonElement).blur()}
            onTouchEnd={(e) => (e.currentTarget as HTMLButtonElement).blur()}
            aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
            aria-pressed={open}
            className={`p-2 rounded-md outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 border-0 focus:bg-transparent transition-colors ${canHover ? 'hover:bg-black/5 active:bg-black/10' : 'hover:bg-transparent active:bg-transparent'}` }
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <g key="hamburger">
                  <path d="M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </g>
              )}
            </svg>
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="md:hidden overflow-hidden -mt-px"
          >
            <div className="px-4 py-2 flex flex-col">
              {links.map(l => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={(e)=>handleNavClick(e, l.href)}
                  className="block rounded-md px-3 py-2 text-base text-gray-900 hover:bg-black/5"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
