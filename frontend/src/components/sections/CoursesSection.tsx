import { useEffect, useState } from 'react';
import Modal from '../Modal';
import { motion } from 'framer-motion';

type Course = {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  tags?: any[];
};

export default function CoursesSection() {
  const API_BASE = import.meta.env.VITE_API_URL || '';
  const [items, setItems] = useState<Course[]>([]);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const baseUrl = API_BASE?.replace(/\/+$/, '') || '';
      const res = await fetch(`${baseUrl}/api/courses`, { cache: 'no-store' });
      if (!res.ok) {
        setItems([]);
        return;
      }
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      // Не показываем ошибку пользователю, просто скрываем секцию
      setItems([]);
    }
  };

  useEffect(() => { load(); }, []);

  const openCourse = async (c: Course) => {
    try {
      setOpen(true);
      setCurrent(c);
      setLoading(true);
      setError(null);

      // Загружаем содержимое курса
      const baseUrl = API_BASE?.replace(/\/+$/, '') || '';
      const res = await fetch(`${baseUrl}/api/courses/${c.id}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Не удалось загрузить курс');
      // const courseData = await res.json();
    } catch (e: any) {
      setError(e?.message || 'Ошибка при загрузке курса');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && !open && <div className="text-red-600 mb-4">{error}</div>}

      {items.length === 0 ? (
        <div className="text-gray-500 text-center">Курсы скоро появятся</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {items.map((c, i) => (
            <motion.button
              key={c.id}
              onClick={() => openCourse(c)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="text-left p-7 md:p-8 rounded-3xl bg-white/70 backdrop-blur shadow-md border border-white/60 hover:shadow-lg transition-shadow"
            >
              <div className="font-bold text-secondary text-xl md:text-2xl leading-snug">{c.title || ''}</div>
              {c.description && (
                <div className="text-gray-600 text-sm mt-2">{c.description}</div>
              )}
              <div className="text-gray-600 text-sm mt-2">
                Нажмите, чтобы открыть
              </div>
            </motion.button>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={current?.title || 'Курс'}>
        {loading && <div className="text-gray-600">Загрузка…</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && !error && (
          <div className="text-gray-600 text-center py-8">
            Содержимое курса появится позже
          </div>
        )}
      </Modal>
    </>
  );
}
