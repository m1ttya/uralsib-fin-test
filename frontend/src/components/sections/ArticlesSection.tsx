import { useEffect, useState } from 'react';
import Modal from '../Modal';
import PdfViewer from '../PdfViewer';
import { motion } from 'framer-motion';

type Article = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  tags?: any[];
};

export default function ArticlesSection() {
  const API_BASE = import.meta.env.VITE_API_URL || '';
  const [items, setItems] = useState<Article[]>([]);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Article | null>(null);
  const [html, setHtml] = useState<string>('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const baseUrl = API_BASE?.replace(/\/+$/, '') || '';
      const res = await fetch(`${baseUrl}/api/articles`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Не удалось загрузить список статей');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || 'Ошибка загрузки статей');
    }
  };

  useEffect(() => { load(); }, []);

  const openArticle = async (a: Article) => {
    try {
      setOpen(true);
      setCurrent(a);
      setLoading(true);
      setError(null);
      setHtml('');
      setPdfUrl(null);

      // Загружаем содержимое статьи из нового API
      const baseUrl = API_BASE?.replace(/\/+$/, '') || '';
      const res = await fetch(`${baseUrl}/api/articles/${a.id}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Не удалось загрузить статью');
      const articleData = await res.json();
      setHtml(articleData.content);
    } catch (e: any) {
      setError(e?.message || 'Ошибка при загрузке статьи');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && !open && <div className="text-red-600 mb-4">{error}</div>}

      {items.length === 0 ? (
        <div className="text-gray-500 text-center">Статей пока нет</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {items.map((a, i) => (
            <motion.button
              key={a.id}
              onClick={() => openArticle(a)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="text-left p-7 md:p-8 rounded-3xl bg-white/70 backdrop-blur shadow-md border border-white/60 hover:shadow-lg transition-shadow"
            >
              <div className="font-bold text-secondary text-xl md:text-2xl leading-snug">{(a.title || '').replace(/^Imported:\s*/i, '').replace(/\.(pdf|docx)$/i, '').trim()}</div>
              <div className="text-gray-600 text-sm mt-2">
                Нажмите, чтобы открыть
              </div>
            </motion.button>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={((current?.title || 'Статья').replace(/^Imported:\s*/i, '').replace(/\.(pdf|docx)$/i, '').trim())}>
        {loading && <div className="text-gray-600">Загрузка…</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && !error && html && (
          <div className="prose prose-neutral max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
        )}
        {!loading && !error && !html && pdfUrl && (
          <div className="w-full">
            <PdfViewer url={pdfUrl} className="max-h-[70vh] overflow-auto" />
          </div>
        )}
      </Modal>
    </>
  );
}
