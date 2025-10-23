import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CollapseText({ title, text }: { title: string; text: string }) {
  const [open, setOpen] = useState(false);
  const limit = 160; // characters approx for preview
  const showToggle = text.length > limit;
  const preview = showToggle ? text.slice(0, limit) + '…' : text;
  return (
    <motion.div
      className="mt-4 sm:mt-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 0.8, 0.36, 1] }}
    >
      <div className="rounded-2xl bg-success-bg text-gray-800 border border-success/20 p-4">
        <div className="text-success font-semibold mb-2">{title}</div>
        <AnimatePresence initial={false}>
          <motion.div
            key={open ? 'full' : 'preview'}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 0.8, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
              {open ? text : preview}
            </div>
          </motion.div>
        </AnimatePresence>
        {showToggle && (
          <button onClick={() => setOpen(v=>!v)} className="mt-3 text-primary hover:text-secondary text-sm font-semibold">
            {open ? 'Свернуть' : 'Показать больше'}
          </button>
        )}
      </div>
    </motion.div>
  );
}
