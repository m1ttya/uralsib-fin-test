import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const links = [
  { href: '#home', label: 'Главная' },
  { href: '#tests', label: 'Тесты' },
  { href: '#articles', label: 'Статьи' },
  { href: '#about', label: 'О нас' },
];

export default function NavBar({ onStart }: { onStart: () => void }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const id = href.replace('#', '');
    const target = document.getElementById(id);
    if (target) {
      const headerH = (headerRef.current?.offsetHeight ?? 64) + 12; // +маленький зазор
      const y = target.getBoundingClientRect().top + window.scrollY - headerH;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setOpen(false);
    }
  };
  return (
    <header ref={headerRef} className={`sticky top-3 z-40 w-[min(1180px,94%)] mx-auto transition-all ${scrolled ? 'backdrop-blur bg-white/70 shadow-lg' : 'backdrop-blur bg-white/50'} ${open ? 'rounded-t-2xl rounded-b-none border-b-0' : 'rounded-2xl'} border border-white/40 relative pointer-events-auto`}> 
      <div className="flex items-center justify-between px-4 py-3" id="navbar-inner">
        <a href="#home" className="flex items-center gap-2">
          <img src={`${import.meta.env.BASE_URL}uralsib_logo.svg`} alt="Уралсиб" className="h-8 w-auto"/>
        </a>
        <nav className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <a key={l.href} href={l.href} onClick={(e)=>handleNavClick(e, l.href)} className="text-base text-gray-700 hover:text-primary transition-colors">{l.label}</a>
          ))}
          <button onClick={onStart} aria-label="Войти" className="p-2 rounded-full bg-primary text-white hover:bg-secondary transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5Zm0 2c-3.866 0-7 3.134-7 7h2a5 5 0 0 1 10 0h2c0-3.866-3.134-7-7-7Z" fill="currentColor"/>
            </svg>
          </button>
        </nav>
        <div className="md:hidden flex items-center gap-2">
          <button onClick={onStart} aria-label="Войти" className="p-2 rounded-full bg-primary text-white hover:bg-secondary transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5Zm0 2c-3.866 0-7 3.134-7 7h2a5 5 0 0 1 10 0h2c0-3.866-3.134-7-7-7Z" fill="currentColor"/>
            </svg>
          </button>
          <button onClick={() => setOpen(v=>!v)} aria-label="menu">
            <div className="w-6 h-0.5 bg-gray-700 mb-1"></div>
            <div className="w-6 h-0.5 bg-gray-700 mb-1"></div>
            <div className="w-6 h-0.5 bg-gray-700"></div>
          </button>
        </div>
      </div>
      <AnimatePresence mode="wait">
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 0.8, 0.36, 1] }}
            style={{ willChange: 'transform, opacity' }}
            className="md:hidden absolute top-full left-0 right-0 z-40 transform-gpu bg-white/70 backdrop-blur rounded-b-2xl border border-t-0 border-white/40 overflow-hidden"
          >
            <div className="px-4">
              {links.map(l => (
                <a key={l.href} href={l.href} onClick={(e)=>handleNavClick(e, l.href)} className="block text-base text-gray-700 py-2">{l.label}</a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
