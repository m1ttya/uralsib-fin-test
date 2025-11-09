import React, { useState, useEffect } from 'react';
import ArticleEditor from './ArticleEditor';

type ProductRef = { category?: string; title: string; linkUrl: string; linkText?: string };

interface Article {
  id: string;
  title: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
  author?: string;
  tags?: ProductRef[];
}

interface ArticleWithContent extends Article {
  content: string;
}

export default function ArticlesManager() {
  const API_BASE = import.meta.env.VITE_API_URL || '';
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingArticle, setEditingArticle] = useState<ArticleWithContent | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Products for tagging
  const [productsByTopic, setProductsByTopic] = useState<Record<string, ProductRef[]>>({});
  useEffect(() => {
    const baseUrl = API_BASE?.replace(/\/+$/, '') || '';
    fetch(`${baseUrl}/api/admin/products_by_topic`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setProductsByTopic(data || {}))
      .catch(() => setProductsByTopic({}));
  }, []);

  // Load articles list
  const loadArticles = async () => {
    try {
      setLoading(true);
      const baseUrl = API_BASE?.replace(/\/+$/, '') || '';
      const response = await fetch(`${baseUrl}/api/articles/admin/list`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to load articles');
      }

      const data = await response.json();
      setArticles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  // Load article for editing
  const handleEdit = async (id: string) => {
    try {
      const baseUrl = API_BASE?.replace(/\/+$/, '') || '';
      const response = await fetch(`${baseUrl}/api/articles/admin/${id}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to load article');
      }

      const article = await response.json();
      // Normalize legacy string[] tags -> ProductRef[]
      const normTags = Array.isArray(article.tags)
        ? article.tags.map((t: any) => typeof t === 'string' ? ({ title: t, linkUrl: '' }) : t)
        : [];
      setEditingArticle({ ...article, tags: normTags });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load article');
    }
  };

  // Save article
  const handleSave = async (content: string) => {
    if (!editingArticle) return;

    try {
      const baseUrl = API_BASE?.replace(/\/+$/, '') || '';
      const url = editingArticle.id === 'new'
        ? `${baseUrl}/api/articles/admin/create`
        : `${baseUrl}/api/articles/admin/${editingArticle.id}`;
      
      const method = editingArticle.id === 'new' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: editingArticle.title,
          content,
          tags: editingArticle.tags,
          status: editingArticle.status
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save article');
      }

      setEditingArticle(null);
      setIsCreating(false);
      await loadArticles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save article');
    }
  };

  // Delete article
  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту статью?')) return;

    try {
      const baseUrl = API_BASE?.replace(/\/+$/, '') || '';
      const response = await fetch(`${baseUrl}/api/articles/admin/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete article');
      }

      await loadArticles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete article');
    }
  };

  // Toggle status
  const handleToggleStatus = async (article: Article) => {
    const originalArticles = [...articles];
    const newStatus = article.status === 'published' ? 'draft' : 'published';

    // Optimistic update - обновляем локально сразу
    setArticles(prev => prev.map(a =>
      a.id === article.id ? { ...a, status: newStatus } : a
    ));

    try {
      const baseUrl = API_BASE?.replace(/\/+$/, '') || '';
      const response = await fetch(`${baseUrl}/api/articles/admin/${article.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus
        })
      });

      if (!response.ok) {
        // Откатываем изменения при ошибке
        setArticles(originalArticles);
        throw new Error('Failed to update status');
      }
      // Не перезагружаем все статьи - оптимистическое обновление уже применилось
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
      // Откатываем изменения при ошибке
      setArticles(originalArticles);
    }
  };

  // File upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const baseName = file.name.replace(/\.(pdf|docx)$/i, '').trim();

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', baseName);

    try {
      setUploadingFile(true);
      const baseUrl = API_BASE?.replace(/\/+$/, '') || '';
      const response = await fetch(`${baseUrl}/api/articles/admin/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const result = await response.json();
      
      // Open the imported article for editing
      setEditingArticle({
        id: result.id,
        title: baseName,
        content: result.content,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: []
      });

      await loadArticles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setUploadingFile(false);
      // Reset file input
      event.target.value = '';
    }
  };

  // Create new article
  const handleCreate = () => {
    setEditingArticle({
      id: 'new',
      title: 'Новая статья',
      content: '<p>Начните писать вашу статью...</p>',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: []
    });
    setIsCreating(true);
  };

  if (loading) {
    return <div className="text-center py-8">Загрузка статей...</div>;
  }

  if (editingArticle) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-primary mb-1">
          {isCreating ? 'Создание статьи' : 'Редактирование статьи'}
        </h2>

        {/* Article metadata */}
        <div className="mt-4 mb-6 p-4 bg-gray-50 rounded">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Заголовок</label>
              <input
                type="text"
                value={editingArticle.title}
                onChange={(e) => setEditingArticle({
                  ...editingArticle,
                  title: e.target.value
                })}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Статус</label>
              <select
                value={editingArticle.status}
                onChange={(e) => setEditingArticle({
                  ...editingArticle,
                  status: e.target.value as 'draft' | 'published'
                })}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="draft">Черновик</option>
                <option value="published">Опубликовано</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Теги (выберите продукты)</label>
            <div className="space-y-2">
              {Object.keys(productsByTopic).length === 0 ? (
                <div className="text-sm text-gray-500">Продукты ещё не настроены. Откройте вкладку «Продукты».</div>
              ) : (
                Object.entries(productsByTopic).map(([cat, items]) => (
                  <div key={cat} className="border rounded p-2">
                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">{cat}</div>
                    <div className="flex flex-wrap gap-2">
                      {items.map((it) => {
                        const selected = (editingArticle.tags || []).some((t: any) =>
                            (typeof t === 'string' && t === it.title) ||
                            (t && (t.linkUrl === it.linkUrl || t.title === it.title))
                          );
                        return (
                          <button
                            type="button"
                            key={it.linkUrl}
                            onClick={() => {
                              setEditingArticle(prev => {
                                if (!prev) return prev;
                                const current = (prev.tags || []) as ProductRef[];
                                const exists = current.some((t: any) =>
                                  (typeof t === 'string' && t === it.title) ||
                                  (t && (t.linkUrl === it.linkUrl || t.title === it.title))
                                );
                                const next = exists
                                  ? current.filter((t: any) => !(
                                      (typeof t === 'string' && t === it.title) ||
                                      (t && (t.linkUrl === it.linkUrl || t.title === it.title))
                                    ))
                                  : [...current, { ...it, category: cat }];
                                return { ...prev, tags: next };
                              });
                            }}
                            className={`px-3 py-1 rounded-full text-sm border ${selected ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                          >
                            {(it.title || '').replace(/^https?:\/\//,'')}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
            {!!(editingArticle.tags || []).length && (
              <div className="mt-2 text-xs text-gray-600">Выбрано: {(editingArticle.tags || []).length}</div>
            )}
          </div>
        </div>

        <ArticleEditor
          initialContent={editingArticle.content}
          onSave={handleSave}
          onCancel={() => {
            setEditingArticle(null);
            setIsCreating(false);
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-primary mb-1">Управление статьями</h2>
          <div className="text-gray-600 text-sm mb-3">Создание и редактирование статей</div>
        </div>
        <div className="flex gap-3">
          {/* File upload */}
          <label className="inline-flex items-center gap-2 px-4 h-9 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 cursor-pointer">
            {uploadingFile ? 'Загрузка...' : 'Загрузить файл'}
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileUpload}
              disabled={uploadingFile}
              className="hidden"
            />
          </label>

          {/* Create new article */}
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 h-9 rounded-lg bg-primary text-white hover:bg-secondary"
          >
            Создать статью
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-6 mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Articles list */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Заголовок
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Обновлено
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Теги
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {articles.map((article) => (
              <tr key={article.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {(article.title || '').replace(/^Imported:\s*/i, '').replace(/\.(pdf|docx)$/i, '').trim()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer ${
                      article.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStatus(article);
                    }}
                  >
                    {article.status === 'published' ? 'Опубликовано' : 'Черновик'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(article.updatedAt).toLocaleDateString('ru-RU')}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {Array.isArray(article.tags) && (article.tags as any[]).length > 0 ? `${(article.tags as any[]).length} тег(ов)` : '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(article.id)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 mr-2"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => handleDelete(article.id)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-600"
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {articles.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Статьи не найдены. Создайте первую статью.
          </div>
        )}
      </div>
    </div>
  );
}