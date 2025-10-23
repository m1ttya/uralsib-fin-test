import { ReactNode, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function Modal({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: ReactNode; title?: string; }) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (!open) return;
    const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPadding = document.body.style.paddingRight;
    document.body.style.overflow = 'hidden';
    if (scrollbarW > 0) document.body.style.paddingRight = `${scrollbarW}px`;
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPadding;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: 16, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative w-[min(100%,960px)] bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              {title && <div className="text-xl font-bold text-primary">{title}</div>}
              <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-primary" aria-label="Закрыть">✕</button>
            </div>
            {/* Scrollable content area so scrollbar doesn't touch rounded edges */}
            <div className="max-h-[70vh] overflow-auto px-6 py-4 modal-scroll-area">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
