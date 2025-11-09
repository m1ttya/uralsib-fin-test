import React, { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
        active ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
      }`}
    >
      {children}
    </button>
  );
}

// Компонент для заголовков страниц в админ-панели
function SectionTitle({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-primary mb-1">{children}</h2>
      {subtitle && <div className="text-gray-600 text-sm">{subtitle}</div>}
    </div>
  );
}

// Компонент для заголовков секций внутри страниц
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b border-gray-200 pb-2 mb-4">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {subtitle && <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>}
    </div>
  );
}

type ProductItem = { title: string; linkUrl: string; linkText: string };

type ProductsByTopic = Record<string, ProductItem[]>;

type ItemFieldErrors = Partial<Record<keyof ProductItem, string>>;
type ErrorsMap = Record<string, Record<number, ItemFieldErrors>>;

/* Removed deprecated IconButton */

// Unified small button component for consistent sizing/typography
function Btn({ children, onClick, disabled, variant = 'default', asLabel = false }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; variant?: 'default' | 'primary' | 'danger' | 'outline'; asLabel?: boolean }) {
  const base = 'inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors';
  const palette = {
    default: 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-800',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-800',
    primary: 'bg-primary text-white hover:bg-secondary disabled:opacity-50',
    danger: 'bg-red-50 text-red-700 hover:bg-red-100',
  } as const;
  const cls = `${base} ${palette[variant]}`;
  if (asLabel) {
    return <label className={`${cls} ${disabled ? 'opacity-60 pointer-events-none' : ''}`} /> as any;
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

const Svg = ({ path, className = '' }: { path: string; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${className}`}>
    <path d={path} />
  </svg>
);

import { IconActionButton } from './IconActionButton';
const RefreshIcon = () => <Svg path="M21 12a9 9 0 1 1-3-6.7M21 3v6h-6"/>;
import { PlusIcon, PencilIcon, CheckIcon, XIcon, UploadIcon, LogoutIcon } from './icons';
import PdfViewer from '../PdfViewer';
const SaveIcon = () => <Svg path="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2M17 21V13H7v8"/>;
const UndoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="M9 15L3 9m0 0l6-6M3 9h12a4 4 0 010 8h-3" />
  </svg>
);

const EditIcon = () => <PencilIcon />;

function ProductsEditor() {
  const API_BASE = import.meta.env.VITE_API_URL || '';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProductsByTopic>({});
  const [original, setOriginal] = useState<ProductsByTopic>({});
  const [errors, setErrors] = useState<ErrorsMap>({});

  const load = async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/admin/products_by_topic`, { credentials: 'include' });
      if (!res.ok) throw new Error('Ошибка загрузки');
      const json = (await res.json()) as ProductsByTopic;
      setData(json);
      setOriginal(json);
      setErrors({});
    } catch (e: any) {
      setError(e?.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const validate = (d: ProductsByTopic) => {
    const result: ErrorsMap = {};
    for (const [cat, items] of Object.entries(d)) {
      items.forEach((it, idx) => {
        const itemErr: Partial<Record<keyof ProductItem, string>> = {};
        if (!it.title?.trim()) itemErr.title = 'Обязательное поле';
        if (!it.linkUrl?.trim()) itemErr.linkUrl = 'Обязательное поле';
        else {
          try {
            const u = new URL(it.linkUrl);
            if (!/^https?:$/.test(u.protocol)) itemErr.linkUrl = 'Должен быть http(s) URL';
          } catch {
            itemErr.linkUrl = 'Некорректный URL';
          }
        }
        if (Object.keys(itemErr).length) {
          if (!result[cat]) result[cat] = {} as any;
          (result[cat] as any)[idx] = itemErr;
        }
      });
    }
    setErrors(result);
    return result;
  };

  const onSave = async () => {
    try {
      setError(null);
      setSaving(true);
      const errs = validate(data);
      if (Object.keys(errs).length) throw new Error('Исправьте ошибки перед сохранением');
      const res = await fetch(`${API_BASE}/api/admin/products_by_topic`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Не удалось сохранить');
      setOriginal(data);
    } catch (e: any) {
      setError(e?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const onCancel = () => {
    setData(original);
    setErrors({});
  };

  const addCategory = () => {
    const key = prompt('Введите ключ категории (латиницей, например: deposits, credits):');
    if (!key) return;
    if (data[key]) return alert('Такая категория уже существует');
    setData({ ...data, [key]: [] });
  };

  const renameCategory = (oldKey: string) => {
    const newKey = prompt('Новое имя ключа категории:', oldKey);
    if (!newKey || newKey === oldKey) return;
    if (data[newKey]) return alert('Категория с таким ключом уже есть');
    const entries = Object.entries(data).map(([k, v]) => [k === oldKey ? newKey : k, v]) as [string, ProductItem[]][];
    const next = Object.fromEntries(entries) as ProductsByTopic;
    setData(next);
  };

  const removeCategory = (key: string) => {
    if (!confirm(`Удалить категорию ${key}?`)) return;
    const copy = { ...data };
    delete copy[key];
    setData(copy);
  };

  const addItem = (key: string) => {
    const copy = { ...data };
    copy[key] = [...(copy[key] || []), { title: '', linkUrl: '', linkText: '' }];
    setData(copy);
  };

  const updateItem = (key: string, idx: number, field: keyof ProductItem, value: string) => {
    const copy = { ...data };
    copy[key] = copy[key].map((it, i) => (i === idx ? { ...it, [field]: value } : it));
    setData(copy);
  };

  const removeItem = (key: string, idx: number) => {
    const copy = { ...data };
    copy[key] = copy[key].filter((_, i) => i !== idx);
    setData(copy);
  };

  const hasErrors = Object.keys(errors).length > 0;

  const CategoryHint = () => (
    <div className="text-xs text-gray-500">
      Подсказка по ключам категорий: deposits (вклады), credits (кредиты), mortgage (ипотека), investments (инвестиции), insurance (страхование), cards (карты), budgeting (бюджет и онлайн).
    </div>
  );

  // Рендер предпросмотра карточек справа
  const Preview = () => (
    <div className="sticky top-4">
      <div className="text-sm font-medium text-primary mb-2">Предпросмотр</div>
      <div className="space-y-4">
        {Object.entries(data).map(([cat, items]) => (
          <div key={cat}>
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">{cat}</div>
            <div className="grid grid-cols-1 gap-3">
              {items.map((p, i) => (
                <div key={i} className="text-left rounded-xl p-4 bg-white/70 hover:bg-white shadow-sm transition-all border">
                  <div className="text-gray-900 font-semibold mb-1 text-base">{(p.title || '').replace(/^https?:\/\//,'') || 'Без названия'}</div>
                  <div className="text-primary text-sm">{p.linkText || 'Перейти'}</div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="text-gray-400 text-sm">Нет продуктов</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-primary mb-1">Редактор рекомендаций (products_by_topic.json)</h2>
          <div className="mb-3"><CategoryHint /></div>
        </div>
        <div className="flex items-center gap-2">
          <IconActionButton title="Отменить" onClick={onCancel}>
              <UndoIcon />
              <span className="hidden sm:inline">Отменить</span>
            </IconActionButton>
          <IconActionButton title="Добавить категорию" onClick={addCategory}>
            <PlusIcon />
            <span className="hidden sm:inline">Категория</span>
          </IconActionButton>
          <Btn variant="primary" onClick={onSave} disabled={saving || hasErrors}>
<SaveIcon />
<span className="hidden sm:inline">{saving ? 'Сохранение…' : 'Сохранить'}</span>
</Btn>
        </div>
      </div>
      {error && <div className="my-4 p-3 text-sm text-red-600 border border-red-100 bg-red-50 rounded-lg">{error}</div>}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {loading ? (
          <div className="text-gray-500">Загрузка…</div>
        ) : (
          <>
            <div className="lg:col-span-2 space-y-6">
              {Object.entries(data).length === 0 ? (
                <div className="text-gray-500">Категории отсутствуют. Нажмите «Добавить категорию».</div>
              ) : (
                Object.entries(data).map(([key, items]) => (
                  <div key={key} className="border rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
                      <div className="font-medium text-gray-800">Категория: {key}</div>
                      <div className="flex items-center gap-2">
                        <IconActionButton title="Переименовать" onClick={() => renameCategory(key)} iconOnly>
                          <PencilIcon />
                        </IconActionButton>
                        <IconActionButton title="Добавить продукт" onClick={() => addItem(key)}>
                          <PlusIcon />
                          <span className="hidden sm:inline">Продукт</span>
                        </IconActionButton>
                        <IconActionButton title="Удалить категорию" onClick={() => removeCategory(key)} variant="danger" iconOnly>
                          <XIcon />
                        </IconActionButton>
                      </div>
                    </div>
                    <div className="p-4 space-y-4">
                      {items.length === 0 ? (
                        <div className="text-gray-500 text-sm">Нет продуктов. Добавьте первый.</div>
                      ) : (
                        items.map((it, idx) => {
                          const itemErr = (errors[key] && (errors[key] as any)[idx]) || {};
                          return (
                            <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                              <label className="block">
                                <div className="text-xs text-gray-500 mb-1">Заголовок</div>
                                <input value={it.title} onChange={(e)=>{updateItem(key, idx, 'title', e.target.value);}} onBlur={()=>validate(data)} className={`w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 ${itemErr.title ? 'border-red-300 focus:ring-red-200' : 'focus:ring-primary/20'}`} />
                                {itemErr.title && <div className="text-xs text-red-600 mt-1">{itemErr.title}</div>}
                              </label>
                              <label className="block">
                                <div className="text-xs text-gray-500 mb-1">Ссылка</div>
                                <input value={it.linkUrl} onChange={(e)=>{updateItem(key, idx, 'linkUrl', e.target.value);}} onBlur={()=>validate(data)} className={`w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 ${itemErr.linkUrl ? 'border-red-300 focus:ring-red-200' : 'focus:ring-primary/20'}`} />
                                {itemErr.linkUrl && <div className="text-xs text-red-600 mt-1">{itemErr.linkUrl}</div>}
                              </label>
                              <div className="flex gap-3">
                                <label className="flex-1 block">
                                  <div className="text-xs text-gray-500 mb-1">Текст кнопки</div>
                                  <input value={it.linkText} onChange={(e)=>updateItem(key, idx, 'linkText', e.target.value)} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20" />
                                </label>
                                <IconActionButton title="Удалить продукт" onClick={()=>removeItem(key, idx)} variant="danger" iconOnly className="self-end">
                                  <XIcon />
                                </IconActionButton>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="lg:col-span-1">
              <Preview />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import ArticlesManagerComponent from './ArticlesManager';

function ArticlesManager() {
  return <ArticlesManagerComponent />;
}

function ArticlesManagerOld() {
  const API_BASE = import.meta.env.VITE_API_URL || '';
  type FileItem = { name: string; size: number; mtime: number };
  type Group = { base: string; docx?: FileItem; html?: FileItem; pdf?: FileItem; others: FileItem[] };

  const [list, setList] = useState<FileItem[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [savingTitle, setSavingTitle] = useState<string | null>(null);
  const [selectedBase, setSelectedBase] = useState<string | null>(null);

  const groupFiles = (files: FileItem[]): Group[] => {
    const map = new Map<string, Group>();
    for (const f of files) {
      const m = f.name.match(/^(.*?)(\.(docx|html?|pdf))$/i);
      const base = m ? m[1] : f.name;
      const ext = m ? (m[3] || '').toLowerCase() : '';
      // нормализуем base для сравнения (обрезаем пробелы)
      const norm = base.trim();
      const g = map.get(norm) || { base: norm, others: [] };
      if (ext === 'pdf') g.pdf = f;
      if (ext === 'docx') g.docx = f;
      else if (ext === 'html' || ext === 'htm') g.html = f;
      else g.others.push(f);
      map.set(norm, g);
    }
    return Array.from(map.values()).sort((a,b)=>a.base.localeCompare(b.base));
  };

  const load = async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/admin/articles`, { credentials: 'include' });
      if (!res.ok) {
        const text = await res.text().catch(()=>'');
        throw new Error(text || 'Ошибка загрузки списка');
      }
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        const text = await res.text();
        throw new Error(text || 'Сервер вернул неожиданный ответ');
      }
      const data = await res.json();
      setList(data);
      setGroups(groupFiles(data));
      // load titles meta
      try {
        const mres = await fetch(`${API_BASE}/api/admin/articles/meta`, { credentials: 'include' });
        if (mres.ok) {
          const meta = await mres.json();
          setTitles(meta?.titles || {});
        }
      } catch { /* ignore */ }
    } catch (e: any) {
      setError(e?.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ load(); }, []);

  const onUpload: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(`${API_BASE}/api/admin/articles/upload`, { method: 'POST', body: fd, credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Не удалось загрузить');
      await load();
      if (data.html) {
        const baseUrl = API_BASE?.replace(/\/+$/, '') || '';
        const url = `${baseUrl}/api/admin/articles/html?name=${encodeURIComponent(data.html.replace('/articles/',''))}`;
        const htmlRes = await fetch(url, { credentials: 'include' });
        const html = await htmlRes.text();
        setPreviewHtml(html);
      } else {
        setPreviewHtml(null);
      }
    } catch (e: any) {
      setError(e?.message || 'Ошибка загрузки файла');
    } finally {
      e.target.value = '';
    }
  };

  const onDeleteFile = async (name: string) => {
    const res = await fetch(`${API_BASE}/api/admin/articles/${encodeURIComponent(name)}`, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) throw new Error('Не удалось удалить');
  };

  const onDeleteGroup = async (g: Group) => {
    if (!confirm(`Удалить статью «${g.base}» и связанные файлы?`)) return;
    try {
      if (g.html) {
        await onDeleteFile(g.html.name).catch(()=>{});
      }
      if (g.docx) {
        await onDeleteFile(g.docx.name).catch(()=>{});
      }
      for (const o of g.others) {
        await onDeleteFile(o.name).catch(()=>{});
      }
      await load();
      setPreviewHtml(null);
    } catch (e: any) {
      setError(e?.message || 'Ошибка удаления');
    }
  };

  return (
    <div>
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="text-lg font-semibold text-primary">Статьи</div>
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 px-3 h-9 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer">
            <input type="file" accept=".docx,.pdf,.html" className="hidden" onChange={onUpload} />
            <span className="inline-flex items-center gap-2"><PlusIcon className="text-gray-700" /><span>Загрузить</span></span>
          </label>
        </div>
      </div>
      {error && <div className="px-6 py-3 text-sm text-red-600 border-b border-red-100 bg-red-50">{error}</div>}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
        <div className="lg:col-span-1">
          {loading ? (
            <div className="text-gray-500">Загрузка…</div>
          ) : groups.length === 0 ? (
            <div className="text-gray-500">Нет статей</div>
          ) : (
            <ul className="divide-y border rounded-xl overflow-hidden bg-white">
              {groups.map((g) => (
                <li key={g.base} className="px-4 py-3 grid grid-cols-12 gap-3 items-center relative">
                  <button className="col-span-12 text-left min-w-0 rounded-lg p-2 transition hover:bg-gray-50 focus:outline-none relative z-0" onClick={async ()=>{
                    setSelectedBase(g.base);
                    setPreviewPdfUrl(null);
                    let name = g.html?.name || (g.docx ? (g.docx.name.replace(/\.docx$/i, '.html')) : null);
                    if (name) {
                      let resp = await fetch(`${API_BASE}/api/admin/articles/html?name=${encodeURIComponent(name)}`, { credentials: 'include' });
                      if (resp.status === 404 && g.docx) {
                        // попробуем сконвертировать на лету
                        const conv = await fetch(`${API_BASE}/api/admin/articles/convert?name=${encodeURIComponent(g.docx.name)}`, { credentials: 'include' });
                        if (conv.ok) {
                          name = g.docx.name.replace(/\.docx$/i, '.html');
                          resp = await fetch(`${API_BASE}/api/admin/articles/html?name=${encodeURIComponent(name)}`, { credentials: 'include' });
                        }
                      }
                      const html = await resp.text();
                      setPreviewHtml(html);
                    } else if (g.pdf) {
                      setPreviewHtml(null);
                      setPreviewPdfUrl(`${API_BASE}/articles/${encodeURIComponent(g.pdf.name)}`);
                    } else {
                      setPreviewHtml(null);
                    }
                  }}>
                    <div className="font-medium truncate">{g.base}</div>
                    <div className="text-xs text-gray-500">
                      {(() => {
                        const files = [g.docx, g.html, ...g.others].filter(Boolean) as FileItem[];
                        const count = files.length;
                        const total = files.reduce((sum, f) => sum + f.size, 0);
                        const latest = files.reduce((m, f) => Math.max(m, f.mtime), 0);
                        return `${count} файл(а) • ${(total/1024).toFixed(1)} КБ • ${new Date(latest).toLocaleString()}`;
                      })()}
                    </div>
                  </button>
                  <div className="col-span-12 mt-1 flex items-center gap-2 justify-between relative z-10">
                    <div className="flex items-center gap-2">
                      <input
                        value={titles[g.base] ?? g.base}
                        onChange={e=>setTitles(prev=>({ ...prev, [g.base]: e.target.value }))}
                        onMouseDown={(e)=>e.stopPropagation()}
                        onClick={(e)=>e.stopPropagation()}
                        onBlur={async (e) => {
                          const oldBase = g.base;
                          const newTitle = (e.currentTarget.value || '').trim() || oldBase;

                          try {
                            setSavingTitle(oldBase);

                            // 1) Сохраняем метаданные названия (как и сейчас)
                            const payload = { titles: { ...titles, [oldBase]: newTitle } };
                            const res = await fetch(`${API_BASE}/api/admin/articles/meta`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include',
                              body: JSON.stringify(payload),
                            });
                            if (!res.ok) throw new Error('Не удалось сохранить название');

                            // 2) Если база изменилась — переименовываем файлы статьи на бэкенде
                            if (newTitle !== oldBase) {
                              const r = await fetch(`${API_BASE}/api/admin/articles/rename`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({ oldBase, newBase: newTitle }),
                              });

                              if (!r.ok) {
                                const errText = await r.text().catch(() => '');
                                throw new Error(errText || 'Не удалось переименовать файлы статьи');
                              }

                              // 3) Обновляем локальное состояние
                              await load();
                              setTitles((prev) => {
                                const next = { ...prev, [newTitle]: prev[oldBase] ?? newTitle } as Record<string, string>;
                                delete (next as any)[oldBase];
                                return next;
                              });
                              setSelectedBase(newTitle);
                            }
                          } catch (err: any) {
                            setError(err?.message || 'Ошибка при сохранении/переименовании');
                          } finally {
                            setSavingTitle(null);
                          }
                        }}
                        className="border rounded-lg px-3 py-2 text-sm w-52 max-w-[15rem] shrink-0"
                        placeholder="Введите название статьи"
                      />
                      {/* Сохранение теперь по blur, кнопку скрываем */}
                      <IconActionButton title="Сохранить название" iconOnly disabled className="hidden"
                      onClick={async ()=>{
                        try {
                          setSavingTitle(g.base);
                          const payload = { titles: { ...titles, [g.base]: titles[g.base] ?? g.base } };
                          const res = await fetch(`${API_BASE}/api/admin/articles/meta`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
                          if (!res.ok) throw new Error('Не удалось сохранить название');
                        } catch (e:any) { setError(e?.message || 'Ошибка сохранения названия'); }
                        finally { setSavingTitle(null); }
                      }}
                    >
                      {savingTitle===g.base ? (
                        <span className="text-xs text-gray-500">…</span>
                      ) : (
                        <CheckIcon />
                      )}
                    </IconActionButton>
                    </div>
                    <button
  onClick={(e)=>{ e.stopPropagation(); onDeleteGroup(g); }}
  title="Удалить"
  aria-label="Удалить статью"
  className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600 shrink-0"
>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M10 8.586l3.536-3.536a1 1 0 111.414 1.414L11.414 10l3.536 3.536a1 1 0 01-1.414 1.414L10 11.414l-3.536 3.536a1 1 0 01-1.414-1.414L8.586 10 5.05 6.464A1 1 0 116.464 5.05L10 8.586z" clipRule="evenodd" />
  </svg>
</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="lg:col-span-2">
          <div className="border rounded-xl bg-white p-4 min-h-[300px]">
            <div className="flex items-center justify-between mb-3 hidden">
              <div className="font-semibold text-gray-800">
                {selectedBase ? (titles[selectedBase] ?? selectedBase) : 'Предпросмотр статьи'}
              </div>
              {selectedBase && (
                <div className="flex items-center gap-2">
                  <button
                    title="Изменить название"
                    onClick={async ()=>{
                      const current = titles[selectedBase!] ?? selectedBase;
                      const next = prompt('Введите новое название статьи', current);
                      if (next == null) return;
                      const payload = { titles: { ...titles, [selectedBase!]: next } };
                      try {
                        setSavingTitle(selectedBase!);
                        await fetch(`${API_BASE}/api/admin/articles/meta`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
                        setTitles(payload.titles);
                      } finally {
                        setSavingTitle(null);
                      }
                    }}
                    className="p-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-600">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793z" />
                      <path d="M11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            {previewHtml ? (
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            ) : previewPdfUrl ? (
              <PdfViewer url={previewPdfUrl} className="w-full" />
            ) : (
              <div className="text-gray-500">Выберите HTML-статью или PDF, либо загрузите DOCX, чтобы посмотреть предпросмотр</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TestsManager() {
  const API_BASE = import.meta.env.VITE_API_URL || '';
  type ProductItem = { title: string; linkUrl: string; linkText?: string; category?: string };
  const [productsByTopicForTests, setProductsByTopicForTests] = useState<Record<string, ProductItem[]>>({});
  useEffect(() => {
    fetch(`${API_BASE}/api/admin/products_by_topic`, { credentials: 'include' })
      .then(r => r.json()).then((d)=> setProductsByTopicForTests(d || {})).catch(()=>setProductsByTopicForTests({}));
  }, []);

  type Node = { files: string[]; folders: Record<string, Node> };
  const [tree, setTree] = useState<Node | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [json, setJson] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [savingTitleKey, setSavingTitleKey] = useState<string | null>(null);

  const loadTree = async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/admin/tests/list`, { credentials: 'include' });
      if (!res.ok) throw new Error('Не удалось получить список тестов');
      const data = await res.json();
      setTree(data);
    } catch (e: any) {
      setError(e?.message || 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ loadTree(); }, []);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/tests/meta`, { credentials: 'include' });
        if (!res.ok) return;
        const meta = await res.json();
        setTitles(meta?.titles || {});
      } catch {}
    };
    loadMeta();
  }, []);

  const openFile = async (relPath: string) => {
    try {
      setSelectedPath(relPath);
      const res = await fetch(`${API_BASE}/api/admin/tests/get?path=${encodeURIComponent(relPath)}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Не удалось загрузить файл');
      const data = await res.json();
      setJson(data);
    } catch (e: any) {
      setError(e?.message || 'Ошибка');
    }
  };

  const saveFile = async () => {
    if (!selectedPath) return;
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/api/admin/tests/save?path=${encodeURIComponent(selectedPath)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(json)
      });
      if (!res.ok) throw new Error('Не удалось сохранить');
    } catch (e: any) {
      setError(e?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const deleteFile = async () => {
    if (!selectedPath) return;
    if (!confirm(`Удалить тест "${selectedPath}"? Это действие нельзя отменить.`)) return;
    try {
      setDeleting(true);
      const res = await fetch(`${API_BASE}/api/tests/admin/delete?path=${encodeURIComponent(selectedPath)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as any)?.error || 'Не удалось удалить тест');
      }
      await loadTree();
      setSelectedPath(null);
      setJson(null);
    } catch (e: any) {
      setError(e?.message || 'Ошибка удаления теста');
    } finally {
      setDeleting(false);
    }
  };

  const validate = (data: any) => {
    const errs: string[] = [];
    if (!data || typeof data !== 'object') { errs.push('Файл не является объектом'); return errs; }
    if (!data.title || typeof data.title !== 'string') errs.push('Отсутствует заголовок (title)');
    if (!Array.isArray(data.questions)) { errs.push('Отсутствует массив questions'); return errs; }
    data.questions.forEach((q: any, qi: number) => {
      if (!q || typeof q !== 'object') { errs.push(`Вопрос #${qi+1} имеет неверный формат`); return; }
      if (!q.text || typeof q.text !== 'string' || !q.text.trim()) errs.push(`Вопрос #${qi+1}: пустой текст`);
      if (!Array.isArray(q.options) || q.options.length < 2) errs.push(`Вопрос #${qi+1}: должно быть минимум 2 варианта`);
      if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex >= (q.options?.length||0)) errs.push(`Вопрос #${qi+1}: некорректный правильный вариант`);
    });
    return errs;
  };

  const updateQuestion = (idx: number, patch: any) => {
    setJson((prev: any) => {
      const next = { ...prev, questions: prev.questions.map((q: any, i: number) => i===idx ? { ...q, ...patch } : q) };
      return next;
    });
  };

  const addQuestion = () => {
    setJson((prev: any) => ({
      ...prev,
      questions: [
        ...prev.questions,
        { id: `q${prev.questions.length+1}`, text: '', options: ['', ''], correctIndex: 0, correctExplanation: '' }
      ]
    }));
  };

  const removeQuestion = (idx: number) => {
    if (!confirm('Удалить вопрос?')) return;
    setJson((prev: any) => ({ ...prev, questions: prev.questions.filter((_: any, i: number) => i!==idx) }));
  };

  const errs = useMemo(() => validate(json), [json]);

  const QuestionsEditor: any = useMemo(() => React.memo((props: any) => {
    const { json, errs, updateQuestion, removeQuestion, addQuestion, setJson } = props;
    return (
      <div className="space-y-4">
        {errs.length > 0 && (
          <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg">
            Исправьте ошибки перед сохранением:
            <ul className="list-disc pl-5 mt-1 space-y-0.5">
              {errs.map((e: string, i: number)=>(<li key={i}>{e}</li>))}
            </ul>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <div className="text-xs text-gray-500 mb-1">ID</div>
            <input value={json.id||''} onChange={(e: any)=>setJson((p:any)=>({...p, id:e.target.value}))} onMouseDown={(e: any)=>e.stopPropagation()} onClick={(e: any)=>e.stopPropagation()} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20" />
          </label>
          <label className="block sm:col-span-1">
            <div className="text-xs text-gray-500 mb-1">Заголовок (title)</div>
            <input value={json.title||''} onChange={(e: any)=>setJson((p:any)=>({...p, title:e.target.value}))} onMouseDown={(e: any)=>e.stopPropagation()} onClick={(e: any)=>e.stopPropagation()} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20" />
          </label>
        </div>
        <div className="text-sm font-semibold text-gray-800 mt-2">Вопросы</div>
        <div className="space-y-6">
          {json.questions.map((q: any, idx: number) => (
            <div key={q.id || idx} className="border rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-gray-700">Вопрос #{idx+1}</div>
                <button onClick={()=>removeQuestion(idx)} className="inline-flex items-center gap-2 p-2.5 rounded-lg text-sm border border-red-200 bg-white hover:bg-red-50 text-red-600">
                  <XIcon />
                  <span className="hidden sm:inline">Удалить</span>
                </button>
              </div>
              <label className="block mb-2">
                <div className="text-xs text-gray-500 mb-1">Текст вопроса</div>
                <input value={q.text} onChange={e=>updateQuestion(idx,{ text:e.target.value })} onMouseDown={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20" />
              </label>
              <div className="text-xs text-gray-500 mb-1">Варианты</div>
              <div className="space-y-2">
                {q.options.map((opt: string, oi: number) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input type="radio" checked={q.correctIndex===oi} onChange={()=>updateQuestion(idx,{ correctIndex: oi })} />
                    <input value={opt} onChange={e=>{
                      const opts = q.options.slice(); opts[oi]=e.target.value; updateQuestion(idx,{ options: opts });
                    }} onMouseDown={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()} className="flex-1 border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20" />
                    <button onClick={()=>{
                      const opts = q.options.filter((_:any,i:number)=>i!==oi); updateQuestion(idx,{ options: opts, correctIndex: Math.min(q.correctIndex, opts.length-1) });
                    }} className="inline-flex items-center gap-2 p-2.5 rounded-lg text-sm border border-red-200 bg-white hover:bg-red-50 text-red-600"><XIcon /><span className="hidden sm:inline">Удалить</span></button>
                  </div>
                ))}
                <div>
                  <button onClick={()=>updateQuestion(idx,{ options:[...q.options, ''] })} className="inline-flex items-center gap-2 px-3 h-9 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm"><PlusIcon /><span className="hidden sm:inline">Добавить вариант</span></button>
                </div>
              </div>
              <label className="block mt-3">
                <div className="text-xs text-gray-500 mb-1">Пояснение к правильному ответу</div>
                <textarea value={q.correctExplanation||''} onChange={e=>updateQuestion(idx,{ correctExplanation:e.target.value })} onMouseDown={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()} className="w-full min-h-[80px] border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20" />
              </label>

              <div className="mt-3">
                <div className="text-xs text-gray-500 mb-1">Теги вопроса (выберите продукты)</div>
                <div className="space-y-2">
                  {Object.keys((props.productsByTopicForTests||{})).length === 0 ? (
                    <div className="text-xs text-gray-500">Продукты ещё не настроены</div>
                  ) : (
                    Object.entries(props.productsByTopicForTests||{}).map(([cat, items]: [string, any]) => (
                      <div key={cat} className="border rounded p-2">
                        <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">{cat}</div>
                        <div className="flex flex-wrap gap-2">
                          {items.map((it: any) => {
                            const selected = Array.isArray(q.tags) && q.tags.some((t:any)=>t.linkUrl===it.linkUrl);
                            return (
                              <button
                                type="button"
                                key={it.linkUrl}
                                onClick={() => {
                                  const current = Array.isArray(q.tags) ? q.tags.slice() : [];
                                  const exists = current.some((t:any)=>t.linkUrl===it.linkUrl);
                                  const next = exists ? current.filter((t:any)=>t.linkUrl!==it.linkUrl) : [...current, { ...it, category: cat }];
                                  updateQuestion(idx, { tags: next });
                                }}
                                className={`px-2 py-1 rounded-full text-xs border ${selected ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
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
                {!!(q.tags||[]).length && (
                  <div className="mt-1 text-xs text-gray-500">Выбрано: {(q.tags||[]).length}</div>
                )}
              </div>
            </div>
          ))}
          <div>
            <button onClick={addQuestion} className="inline-flex items-center gap-2 px-3 h-9 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"><PlusIcon /><span className="hidden sm:inline">Добавить вопрос</span></button>
          </div>
        </div>
      </div>
    );
  }), []);

 const ImportForm = ({ onDone }: { onDone: ()=>void }) => {
    const API_BASE = import.meta.env.VITE_API_URL || '';
    // получаем список корневых папок из дерева, если оно уже загружено
    const rootFolders = Object.keys(tree?.folders || {});
    const [folder, setFolder] = useState<string>(rootFolders[0] || 'adults');

    const [newFolder, setNewFolder] = useState<string>('');
    const [fileName, setFileName] = useState<string>('new_test');
    const [title, setTitle] = useState('Новый тест');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string|null>(null);

    const targetFolder = folder === '__new__' ? newFolder.replace(/\s+/g,'_') : folder;
    const rel = `${targetFolder}/${fileName.replace(/\.json$/i,'')}.json`;

    const onFile: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setErr(null);
      setBusy(true);
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch(`${API_BASE}/api/admin/tests/import?path=${encodeURIComponent(rel)}&title=${encodeURIComponent(title)}`, { method: 'POST', body: fd, credentials: 'include' });
        const data = await res.json().catch(()=>null);
        if (!res.ok) throw new Error(data?.error || 'Импорт не удался');
        onDone();
        setSelectedPath(rel);
        // открыть импортированный файл
        await openFile(rel);
      } catch (e: any) {
        setErr(e?.message || 'Ошибка импорта');
      } finally {
        setBusy(false);
        e.target.value = '';
      }
    };

    return (
      <div className="p-3 border rounded-xl bg-white">
        <div className="text-sm font-medium text-gray-800 mb-3">Импорт/создание теста</div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <div className="text-xs text-gray-500 mb-1.5">Папка</div>
              <select value={folder} onChange={e=>setFolder(e.target.value)} className="w-full h-10 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20">
                <option value="__new__">Новая папка…</option>
                {rootFolders.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </label>
            <label className="block">
              <div className="text-xs text-gray-500 mb-1.5">Имя папки</div>
              <input value={newFolder} onChange={e=>setNewFolder(e.target.value)} placeholder="new_folder" className="w-full h-10 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-gray-50 disabled:text-gray-400" disabled={folder!=='__new__'} />
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <div className="text-xs text-gray-500 mb-1.5">Имя файла</div>
              <input value={fileName} onChange={e=>setFileName(e.target.value)} placeholder="new_test" className="w-full h-10 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
            </label>
            <label className="block">
              <div className="text-xs text-gray-500 mb-1.5">Заголовок теста</div>
              <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Введите заголовок" className="w-full h-10 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
            </label>
          </div>
          
          <div className="flex items-center gap-2">
            <label className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border ${busy? 'opacity-60 pointer-events-none':''} border-gray-200 bg-white hover:bg-gray-50 cursor-pointer w-fit max-w-full`}>
              <input type="file" accept=".docx" className="hidden" onChange={onFile} />
              <span className="inline-flex items-center gap-2"><UploadIcon className="text-gray-700" /><span className="hidden sm:inline">Импорт</span></span>
            </label>
            <button disabled={busy || !fileName.trim() || !title.trim() || (folder==='__new__' && !newFolder.trim())} onClick={async ()=>{
              try {
                setErr(null);
                if (!fileName.trim()) { setErr('Укажите имя файла'); return; }
                if (!title.trim()) { setErr('Укажите заголовок теста'); return; }
                if (folder==='__new__' && !newFolder.trim()) { setErr('Укажите имя новой папки'); return; }
                setBusy(true);
                const payload = { id: title.replace(/\s+/g,'_'), title, questions: [] };
                const res = await fetch(`${API_BASE}/api/admin/tests/save?path=${encodeURIComponent(rel)}`, {
                  method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error('Не удалось создать файл');
                onDone(); setSelectedPath(rel); await openFile(rel);
              } catch (e:any) { setErr(e?.message || 'Ошибка создания'); }
              finally { setBusy(false); }
            }} className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50 whitespace-nowrap">Создать</button>
          </div>
          <div className="text-xs text-gray-500">{folder==='__new__' ? 'Будет создана новая папка и файл:' : 'Файл будет сохранён как:'} <span className="font-mono">{rel}</span></div>
          {err && <div className="text-xs text-red-600">{err}</div>}
        </div>
      </div>
    );
  };

  const renderTree = (node: Node, base = '') => {
    const entries = Object.entries(node.folders || {});
    return (
      <ul className="space-y-2">
        {entries.map(([name, child]) => (
          <li key={base + name}>
            <div className="flex items-center justify-between mb-1 group">
              <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <span>{name}</span>
                <input
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2 py-0.5 border rounded hidden sm:inline-block w-36"
                  placeholder="Отображаемое имя"
                  value={titles[name] ?? (name==='children' ? 'Школьники' : name==='adults' ? 'Взрослые' : name==='pensioners' ? 'Пенсионеры' : name)}
                  onMouseDown={e=>e.stopPropagation()}
                  onClick={e=>e.stopPropagation()}
                  onChange={e => setTitles(prev => ({ ...prev, [name]: e.target.value }))}
                  onBlur={async () => {
                    try {
                      setSavingTitleKey(name);
                      const payload = { titles: { ...titles } };
                      const res = await fetch(`${API_BASE}/api/admin/tests/meta`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
                      if (!res.ok) throw new Error('Не удалось сохранить отображаемое имя');
                    } catch (e:any) {
                      setError(e?.message || 'Ошибка сохранения названия категории');
                    } finally {
                      setSavingTitleKey(null);
                    }
                  }}
                />
              </div>
              <IconActionButton
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                title="Удалить папку"
                variant="danger"
                iconOnly
                onClick={async () => {
                  const folderPath = `${base}${name}`;
                  if (!confirm(`Удалить папку "${folderPath}" со всем содержимым?`)) return;
                  try {
                    const res = await fetch(`${API_BASE}/api/admin/tests/delete-folder?path=${encodeURIComponent(folderPath)}`, {
                      method: 'DELETE',
                      credentials: 'include',
                    });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      throw new Error((data as any)?.error || 'Не удалось удалить папку');
                    }
                    // Если открытый файл внутри папки — сбрасываем редактор
                    if (selectedPath && selectedPath.startsWith(folderPath + '/')) {
                      setSelectedPath(null);
                      setJson(null);
                    }
                    await loadTree();
                  } catch (e: any) {
                    setError(e?.message || 'Ошибка удаления папки');
                  }
                }}
              >
                <XIcon />
              </IconActionButton>
            </div>
            <div className="ml-4">
              {child.files?.map((f) => (
                <div key={f} className="flex items-center justify-between group">
                  <button onClick={() => openFile(`${base}${name}/${f}`)} className="flex-1 text-left text-sm px-2 py-1.5 rounded hover:bg-gray-50">
                    {f}
                  </button>
                  <IconActionButton
                    title="Удалить тест"
                    variant="danger"
                    iconOnly
                    onClick={async () => {
                      if (!confirm(`Удалить тест "${f}"?`)) return;
                      try {
                        const res = await fetch(`${API_BASE}/api/tests/admin/delete?path=${encodeURIComponent(`${base}${name}/${f}`)}`, {
                          method: 'DELETE',
                          credentials: 'include'
                        });
                        if (!res.ok) {
                          const data = await res.json().catch(() => ({}));
                          throw new Error(data.error || 'Не удалось удалить тест');
                        }
                        // Обновляем список после удаления
                        await loadTree();
                        // Если это был открытый файл, закрываем редактор
                        if (selectedPath === `${base}${name}/${f}`) {
                          setSelectedPath(null);
                          setJson(null);
                        }
                      } catch (e: any) {
                        setError(e?.message || 'Ошибка удаления теста');
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <XIcon />
                  </IconActionButton>
                </div>
              ))}
              {renderTree(child, `${base}${name}/`)}
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-primary mb-1">Тесты</h2>
          <div className="text-gray-600 text-sm mb-3">Управление тестами, вопросами и настройками</div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 border-r p-4">
          <ImportForm onDone={() => { loadTree(); }} />
          <div className="h-4" />
          {loading ? (
            <div className="text-gray-500">Загрузка…</div>
          ) : tree ? (
            renderTree(tree)
          ) : (
            <div className="text-gray-500">Нет данных</div>
          )}
        </div>
        <div className="lg:col-span-2 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-gray-800">{selectedPath ? selectedPath : 'Редактор тестов'}</div>
            {selectedPath && (
              <div className="flex items-center gap-2">
                <button
                  onClick={deleteFile}
                  disabled={deleting}
                  className="px-3 h-9 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 inline-flex items-center gap-2"
                  title="Удалить тест"
                >
                  <XIcon />
                  <span className="hidden sm:inline">{deleting ? 'Удаление…' : 'Удалить'}</span>
                </button>
                <button onClick={saveFile} disabled={saving || errs.length > 0} className="px-3 h-9 rounded-lg bg-primary text-white hover:bg-secondary disabled:opacity-50 inline-flex items-center gap-2"><SaveIcon /> <span className="hidden sm:inline">{saving? 'Сохранение…' : 'Сохранить'}</span></button>
              </div>
            )}
          </div>
          <div className="border rounded-xl bg-white p-3 min-h-[300px]">
            {!json ? (
              <div className="text-gray-500">Выберите тест слева, чтобы открыть редактор вопросов</div>
            ) : Array.isArray(json?.questions) ? (
              <QuestionsEditor json={json} errs={errs} updateQuestion={updateQuestion} removeQuestion={removeQuestion} addQuestion={addQuestion} setJson={setJson} productsByTopicForTests={productsByTopicForTests} />
            ) : (
              <div>
                <div className="text-sm text-gray-600 mb-2">Структура файла не распознана как тест. Показан сырой JSON.</div>
                <textarea value={JSON.stringify(json, null, 2)} onChange={e=>{
                  try { setJson(JSON.parse(e.target.value)); setError(null);} catch { /* ignore */ }
                }} className="w-full h-[60vh] font-mono text-xs outline-none" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, hint, spark }: { title: string; value: string; hint?: string; spark?: number[] }) {
  return (
    <div className="relative overflow-hidden p-4 rounded-xl border bg-gradient-to-br from-primary/5 to-transparent shadow-sm">
      <div className="text-xs text-gray-600 mb-1">{title}</div>
      <div className="text-2xl font-semibold text-gray-900">{value}</div>
      {hint && <div className="text-xs text-gray-500 mt-1">{hint}</div>}
      {spark && spark.length > 1 && (
        <svg viewBox="0 0 100 30" className="absolute right-2 bottom-2 h-8 w-[120px] opacity-40">
          <polyline
            fill="none"
            stroke="currentColor"
            className="text-primary"
            strokeWidth="2"
            points={spark
              .map((v, i) => {
                const x = (i / (spark.length - 1)) * 100;
                const y = 30 - (v * 30);
                return `${x},${y}`;
              })
              .join(' ')}
          />
        </svg>
      )}
    </div>
  );
}

function CoursesManager() {
  const API_BASE = import.meta.env.VITE_API_URL || '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/admin/courses`, { credentials: 'include' });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Не удалось загрузить курсы');
        }
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          // Если сервер вернул не JSON, показываем понятное сообщение
          setCourses([]);
          return;
        }
        const data = await res.json();
        setCourses(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setError(e?.message || 'Ошибка загрузки курсов');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-primary mb-1">Курсы</h2>
          <div className="text-gray-600 text-sm mb-3">Управление обучающими курсами и программами</div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 border-r p-4">
          <div className="space-y-2">
            {loading ? (
              <div className="text-gray-500">Загрузка…</div>
            ) : error ? (
              <div className="text-red-600 text-sm">{error}</div>
            ) : courses.length === 0 ? (
              <div className="text-gray-500">
                <div className="mb-2">Курсов пока нет</div>
                <div className="text-xs text-gray-400">Функция управления курсами в разработке</div>
              </div>
            ) : (
              courses.map((course) => (
                <button
                  key={course.id}
                  className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">{course.title}</div>
                  {course.description && (
                    <div className="text-sm text-gray-500 mt-1">{course.description}</div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
        <div className="lg:col-span-2 p-4">
          {error ? (
            <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
              <div className="text-red-700 font-medium mb-1">Ошибка загрузки</div>
              <div className="text-sm text-red-600">{error}</div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-2">Управление курсами</div>
              <div className="text-sm text-gray-400">Функция в разработке. Курсы пока не созданы.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Overview() {
  const API_BASE = import.meta.env.VITE_API_URL || '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tests, setTests] = useState<{ totalFiles: number; byFolder: Record<string, number> }>({ totalFiles: 0, byFolder: {} });
  const [articles, setArticles] = useState<{ groups: number; docx: number; html: number; missingHtml: number }>({ groups: 0, docx: 0, html: 0, missingHtml: 0 });
  const [products, setProducts] = useState<{ categories: number; totalItems: number }>({ categories: 0, totalItems: 0 });

  // Аналитика по тестам (все по нулям до подключения аналитики)
  const testAnalytics = {
    totalCompletions: 0,
    completionRate: 0,
    avgTime: '0:00',
    avgScore: 0
  };

  // Конверсия в регистрацию
  const conversion = {
    registeredAfterTests: 0,
    totalConversions: 0,
    timeToConvert: '-'
  };

  // География
  const geography = {
    cities: 0,
    topCity: '-',
    regionsDistribution: '-'
  };

  // Результаты тестов
  const testResults = {
    popularAnswers: 0,
    difficultQuestions: 0,
    distributionSpread: '-'
  };

  // Рекомендации и продукты
  const recommendations = {
    articlesOpened: 0,
    coursesStarted: 0,
    timeOnTraining: '0:00',
    productTransitions: 0
  };

  // Временные метрики
  const timeMetrics = {
    peakHours: '-',
    avgSession: '0:00',
    weeklyGrowth: '0%'
  };

  // Продуктовая аналитика
  const productAnalytics = {
    creditApplications: 0,
    depositApplications: 0,
    cardApplications: 0,
    leadQuality: '-'
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setError(null); setLoading(true);
        // tests
        const tRes = await fetch(`${API_BASE}/api/admin/tests/list`, { credentials: 'include' });
        if (tRes.ok) {
          const tree = await tRes.json();
          const byFolder: Record<string, number> = {};
          let total = 0;
          const walk = (node: any, path: string[] = []) => {
            const files = node.files || [];
            if (path.length === 1) {
              byFolder[path[0]] = (byFolder[path[0]] || 0) + files.length;
            }
            total += files.length;
            const folders = node.folders || {};
            Object.keys(folders).forEach((k) => walk(folders[k], [...path, k]));
          };
          walk(tree);
          setTests({ totalFiles: total, byFolder });
        }
        // articles - используем meta endpoint для получения данных о статьях
        const aRes = await fetch(`${API_BASE}/api/admin/articles/meta`, { credentials: 'include' });
        if (aRes.ok) {
          const meta = await aRes.json();
          // meta - это массив статей с информацией о docx и html
          if (Array.isArray(meta)) {
            let docx = 0, html = 0, missingHtml = 0;
            meta.forEach((article: any) => {
              if (article.hasDocx) docx++;
              if (article.hasHtml) html++;
              if (article.hasDocx && !article.hasHtml) missingHtml++;
            });
            setArticles({ groups: meta.length, docx, html, missingHtml });
          } else {
            setArticles({ groups: 0, docx: 0, html: 0, missingHtml: 0 });
          }
        }
        // products
        const pRes = await fetch(`${API_BASE}/api/admin/products_by_topic`, { credentials: 'include' });
        if (pRes.ok) {
          const data = await pRes.json();
          const categories = Object.keys(data || {}).length;
          const totalItems = Object.values(data || {}).reduce((sum: number, arr: any) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
          setProducts({ categories, totalItems });
        }
      } catch (e: any) {
        setError(e?.message || 'Ошибка загрузки сводки');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-primary mb-1">Обзор</h2>
          <div className="text-gray-600 text-sm mb-3">Подробная аналитика и статистика по проекту</div>
        </div>
      </div>

      {error && <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg">{error}</div>}

      {/* Аналитика по тестам */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <SectionHeader
          title="📊 Аналитика по тестам"
          subtitle="Статистика прохождения и результатов тестирования"
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Всего прохождений" value={String(testAnalytics.totalCompletions)} hint="За последний месяц" />
          <StatCard title="Конверсия завершения" value={`${testAnalytics.completionRate}%`} hint="Доля завершивших" />
          <StatCard title="Среднее время" value={testAnalytics.avgTime} hint="На прохождение" />
          <StatCard title="Средний балл" value={`${testAnalytics.avgScore}%`} hint="Результат тестов" />
        </div>
        <div className="mt-4 text-sm text-gray-600">
          📝 Детальная статистика по каждому тесту будет доступна после подключения аналитики
        </div>
      </div>

      {/* Конверсия в регистрацию */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <SectionHeader
          title="🎯 Конверсия в регистрацию"
          subtitle="Переходы от тестов к регистрации в банке"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Зарегистрировались" value={String(conversion.registeredAfterTests)} hint="После прохождения тестов" />
          <StatCard title="Общая конверсия" value={`${conversion.totalConversions}%`} hint="Из всех прошедших" />
          <StatCard title="Время до регистрации" value={conversion.timeToConvert} hint="Средний срок" />
        </div>
      </div>

      {/* География и устройства */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <SectionHeader
          title="🌍 География и устройства"
          subtitle="Распределение пользователей по регионам и устройствам"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Городов охвачено" value={String(geography.cities)} hint="По всей России" />
          <StatCard title="Лидер по регионам" value={geography.topCity} hint="Максимальная активность" />
          <StatCard title="Топ регионы" value={geography.regionsDistribution} hint="СПб, Екб, Казань" />
        </div>
      </div>

      {/* Результаты и сложность тестов */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <SectionHeader
          title="📈 Результаты тестов"
          subtitle="Анализ ответов, сложности и распределения результатов"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Популярные ответы" value={`${testResults.popularAnswers}%`} hint="Чаще всего выбираемые" />
          <StatCard title="Сложные вопросы" value={String(testResults.difficultQuestions)} hint="С наибольшими ошибками" />
          <StatCard title="Распределение результатов" value={testResults.distributionSpread} hint="Качество разброса баллов" />
        </div>
      </div>

      {/* Рекомендации и обучение */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <SectionHeader
          title="📚 Рекомендации и обучение"
          subtitle="Эффективность контента и время на обучение"
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Статьи открыты" value={String(recommendations.articlesOpened)} hint="После тестов" />
          <StatCard title="Курсы начаты" value={String(recommendations.coursesStarted)} hint="Заинтересовались" />
          <StatCard title="Время на обучение" value={recommendations.timeOnTraining} hint="Среднее время в секции" />
          <StatCard title="Переходы к продуктам" value={String(recommendations.productTransitions)} hint="Интерес к банковским продуктам" />
        </div>
      </div>

      {/* Временные метрики */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <SectionHeader
          title="⏰ Временные метрики"
          subtitle="Сезонность, активность по часам и поведение пользователей"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Пик активности" value={timeMetrics.peakHours} hint="Наибольшая посещаемость" />
          <StatCard title="Средняя сессия" value={timeMetrics.avgSession} hint="Время на сайте" />
          <StatCard title="Рост за неделю" value={timeMetrics.weeklyGrowth} hint="Увеличение трафика" />
        </div>
      </div>

      {/* Продуктовая аналитика */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <SectionHeader
          title="💳 Продуктовая аналитика"
          subtitle="Переходы к банковским продуктам и качество лидов"
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Заявки на кредит" value={String(productAnalytics.creditApplications)} hint="Прямые заявки" />
          <StatCard title="Заявки на депозит" value={String(productAnalytics.depositApplications)} hint="Потенциальные вкладчики" />
          <StatCard title="Заявки на карту" value={String(productAnalytics.cardApplications)} hint="Наибольший интерес" />
          <StatCard title="Качество лидов" value={productAnalytics.leadQuality} hint="Конверсия в клиентов" />
        </div>
      </div>

      {/* Контент проекта */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <SectionHeader
          title="📦 Контент проекта"
          subtitle="Статистика по тестам, статьям и продуктам"
        />
        <div className="grid md:grid-cols-3 gap-4">
          <StatCard title="Файлы тестов" value={loading ? '…' : String(tests.totalFiles)} hint={Object.entries(tests.byFolder).map(([k,v])=>`${k}: ${v}`).join(', ') || undefined} />
          <StatCard title="Категории продуктов" value={loading ? '…' : String(products.categories)} hint={`Всего карточек: ${products.totalItems}`} />
          <StatCard title="Статьи" value={loading ? '…' : String(articles.groups)} hint={`DOCX: ${articles.docx}, HTML: ${articles.html}${articles.missingHtml?`, без HTML: ${articles.missingHtml}`:''}`} />
        </div>
      </div>

      <div className="text-xs text-gray-500">
        💡 Для активации аналитики требуется подключение системы сбора событий и интеграция с CRM банка. Контент проекта отображается в реальном времени.
      </div>
    </div>
  );
}

function UsersManager() {
  const API_BASE = import.meta.env.VITE_API_URL || '';
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/users/admin/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.valid) {
        setIsAuthorized(true);
        await loadUsers();
      } else {
        setError('Неверный пароль');
      }
    } catch (err) {
      setError('Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch(`${API_BASE}/api/users/admin/list`, {
        headers: {
          'Authorization': `Bearer ${password}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        setError('Не удалось загрузить список пользователей');
      }
    } catch (err) {
      setError('Ошибка загрузки');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('Удалить этого пользователя? Это действие нельзя отменить.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/users/admin/delete/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${password}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        setUsers(users.filter(u => u.user_id !== userId));
        alert('Пользователь удален');
      } else {
        const data = await response.json();
        alert('Ошибка: ' + (data.error || 'Не удалось удалить'));
      }
    } catch (err) {
      alert('Ошибка удаления');
    }
  };

  const handleLogout = () => {
    setIsAuthorized(false);
    setPassword('');
    setUsers([]);
    setError('');
  };

  if (!isAuthorized) {
    return (
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-primary mb-2">Управление пользователями</h2>
            <p className="text-sm text-gray-600">Для доступа введите пароль суперюзера</p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Пароль суперюзера"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 bg-primary text-white rounded-lg hover:bg-secondary disabled:opacity-50 transition-colors"
            >
              {loading ? 'Проверка...' : 'Войти'}
            </button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-primary mb-1">Управление пользователями</h2>
          <p className="text-sm text-gray-600">Всего пользователей: {users.length}</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-600 hover:text-primary inline-flex items-center gap-2"
        >
          <LogoutIcon className="text-gray-600" />
          Выйти
        </button>
      </div>

      {loadingUsers ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Имя</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Логин</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Создан</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.user_id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-600">{user.user_id}</td>
                  <td className="py-3 px-4 text-gray-900">{user.email || '-'}</td>
                  <td className="py-3 px-4 text-gray-900">{user.name || '-'}</td>
                  <td className="py-3 px-4 text-gray-600">{user.username || '-'}</td>
                  <td className="py-3 px-4 text-gray-600">
                    {new Date(user.created_at).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleDelete(user.user_id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Пользователей пока нет
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_URL || '';
  const [tab, setTab] = useState<'overview' | 'tests' | 'products' | 'articles' | 'courses' | 'users'>('overview');

  useEffect(() => {
    // Ensure we are on the admin route
    if (window.location.hash !== '#admin') {
      navigate('/admin');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-3 relative">
          <div className="flex items-center gap-3">
            <img src={`${import.meta.env.BASE_URL}uralsib_logo.svg`} alt="Уралсиб" className="h-8" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-lg font-bold text-primary">Админ-панель</div>
          </div>
          <div className="flex items-center gap-2 absolute right-4 top-1/2 -translate-y-1/2">
            <a
              href="#"
              onClick={async (e) => {
                e.preventDefault();
                try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch {}
                navigate('/');
              }}
              className="text-sm text-gray-600 hover:text-primary inline-flex items-center gap-2"
            >
              <LogoutIcon className="text-gray-600" />
              <span className="hidden sm:inline">Выйти</span>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 text-[14px] leading-tight">
        <div className="flex flex-wrap gap-2 mb-6">
          <TabButton active={tab === 'overview'} onClick={() => setTab('overview')}>Обзор</TabButton>
          <TabButton active={tab === 'tests'} onClick={() => setTab('tests')}>Тесты</TabButton>
          <TabButton active={tab === 'products'} onClick={() => setTab('products')}>Продукты</TabButton>
          <TabButton active={tab === 'articles'} onClick={() => setTab('articles')}>Статьи</TabButton>
          <TabButton active={tab === 'courses'} onClick={() => setTab('courses')}>Курсы</TabButton>
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          <TabButton active={tab === 'users'} onClick={() => setTab('users')}>Пользователи</TabButton>
        </div>

        {tab === 'overview' && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <Overview />
          </section>
        )}

        {tab === 'tests' && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <TestsManager />
          </section>
        )}

        {tab === 'products' && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <ProductsEditor />
          </section>
        )}

        {tab === 'articles' && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <ArticlesManager />
          </section>
        )}

        {tab === 'courses' && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <CoursesManager />
          </section>
        )}

        {tab === 'users' && (
          <UsersManager />
        )}
      </main>
    </div>
  );
}
