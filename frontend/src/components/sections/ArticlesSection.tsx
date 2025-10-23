import { useEffect, useState } from 'react';
import Modal from '../Modal';

// Список статей (DOCX) из public/articles
const articles = [
  { file: 'Акции.docx', title: 'Акции: что это и как на них зарабатывают', tag: 'Инвестиции' },
  { file: 'Вклады.docx', title: 'Вклады: как выбрать под свои цели', tag: 'Сбережения' },
  { file: 'Кредиты.docx', title: 'Кредиты: как не переплачивать', tag: 'Кредитование' },
  { file: 'Займы.docx', title: 'Займы: на что обратить внимание', tag: 'Займы' },
  { file: 'Инвестиционное страхование жизни.docx', title: 'ИСЖ: риски и преимущества', tag: 'Страхование' },
];

export default function ArticlesSection() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<typeof articles[number] | null>(null);
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Preload mammoth only в момент запроса
  }, []);

  const openArticle = async (a: typeof articles[number]) => {
    try {
      setOpen(true); setCurrent(a); setLoading(true); setError(null); setHtml('');
      const mammoth: any = await import('mammoth/mammoth.browser.js');
      const res = await fetch(`${import.meta.env.BASE_URL}articles/${encodeURIComponent(a.file)}`);
      if (!res.ok) throw new Error('Не удалось загрузить файл');
      const arrayBuffer = await res.arrayBuffer();
      const { value } = await mammoth.convertToHtml({ arrayBuffer }, { styleMap: ["p[style-name='Title'] => h1:fresh"] });
      setHtml(value);
    } catch (e: any) {
      setError(e.message || 'Ошибка при загрузке статьи');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="articles" className="py-10 md:py-16 scroll-mt-24">
      <div className="container mx-auto px-4 max-w-6xl">
        <h2 className="text-2xl md:text-4xl font-bold text-primary text-center mb-10">Статьи</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map(a => (
            <button key={a.file} onClick={() => openArticle(a)} className="text-left p-7 md:p-8 rounded-3xl bg-white/70 backdrop-blur shadow-md border border-white/60 hover:shadow-lg transition-shadow">
              <div className="text-lg md:text-xl text-secondary font-semibold mb-2">{a.tag}</div>
              <div className="font-bold text-gray-900 text-xl md:text-2xl leading-snug">{a.title}</div>
              <div className="text-gray-600 text-sm mt-2">Нажмите, чтобы открыть</div>
            </button>
          ))}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={current?.title}>
        {loading && <div className="text-gray-600">Загрузка…</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && !error && html && (
          <div className="prose prose-neutral max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
        )}
      </Modal>
    </section>
  );
}
