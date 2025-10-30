import { useEffect, useState } from 'react';
import Modal from '../Modal';
import PdfViewer from '../PdfViewer';
import { motion } from 'framer-motion';

type Article = {
  base: string;
  title: string;
  htmlName?: string;
  url?: string; // /articles/xxx.html
  hasPdf?: boolean;
  pdfUrl?: string;
};

export default function ArticlesSection() {
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
      const res = await fetch('/api/articles', { cache: 'no-store' });
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
      if (a.url) {
        setPdfLoading(false);
        // Загружаем готовый HTML напрямую, без mammoth
        const res = await fetch(a.url, { cache: 'no-store' });
        if (!res.ok) throw new Error('Не удалось загрузить статью');
        const text = await res.text();
        setHtml(text);
      } else if (a.pdfUrl) {
        setPdfLoading(true);
        // Показываем PDF во всплывающем окне через iframe
        setPdfUrl(a.pdfUrl);
      }
    } catch (e: any) {
      setError(e?.message || 'Ошибка при загрузке статьи');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="articles" className="py-10 md:py-16 scroll-mt-24">
      <div className="container mx-auto px-4 max-w-6xl">
        <h2 className="text-2xl md:text-4xl font-bold text-primary text-center mb-10">Статьи</h2>

        {error && !open && <div className="text-red-600 mb-4">{error}</div>}

        {items.length === 0 ? (
          <div className="text-gray-500 text-center">Статей пока нет</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((a, i) => (
              <motion.button
                key={a.htmlName || a.base}
                onClick={() => {
                  if (a.url || a.pdfUrl) openArticle(a);
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="text-left p-7 md:p-8 rounded-3xl bg-white/70 backdrop-blur shadow-md border border-white/60 hover:shadow-lg transition-shadow"
              >
                <div className="font-bold text-secondary text-xl md:text-2xl leading-snug">{a.title || a.base}</div>
                <div className="text-gray-600 text-sm mt-2">{(a.url || a.pdfUrl) ? 'Нажмите, чтобы открыть' : 'Нет контента'}</div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={current?.title || current?.base}>
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
    </section>
  );
}
