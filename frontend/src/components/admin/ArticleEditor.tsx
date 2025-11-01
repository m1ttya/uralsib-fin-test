import React, { useState, useRef, useEffect } from 'react';

interface ArticleEditorProps {
  initialContent?: string;
  onSave: (content: string) => void;
  onCancel: () => void;
}

export default function ArticleEditor({ initialContent = '', onSave, onCancel }: ArticleEditorProps) {
  const [content, setContent] = useState(initialContent);
  const editorRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [toolbarFixed, setToolbarFixed] = useState(false);
  const [toolbarWidth, setToolbarWidth] = useState<number | undefined>(undefined);
  const [toolbarLeft, setToolbarLeft] = useState<number | undefined>(undefined);
  const [toolbarHeight, setToolbarHeight] = useState<number | undefined>(undefined);
  const [toolbarTop, setToolbarTop] = useState<number>(0);
  const lastImageRef = useRef<HTMLImageElement | null>(null);

  // Устанавливаем начальное содержимое в редактор
  useEffect(() => {
    if (editorRef.current && initialContent) {
      editorRef.current.innerHTML = initialContent;
      setContent(initialContent);
    }
  }, [initialContent]);

  // Следим за скроллом, чтобы фиксировать тулбар вверху экрана
  useEffect(() => {
    const onScrollOrResize = () => {
      const tb = toolbarRef.current;
      const wrap = wrapperRef.current;
      const navbarInner = document.getElementById('navbar-inner');
      if (!tb || !wrap) return;
      const tbRect = tb.getBoundingClientRect();
      const wrapRect = wrap.getBoundingClientRect();
      const tbH = tbRect.height;
      const headerEl = navbarInner?.parentElement as HTMLElement | null;
      const headerRect = headerEl?.getBoundingClientRect();
      const navBottom = headerRect ? headerRect.bottom : ((navbarInner?.offsetHeight ?? 64) + 12);

      // Фиксируем тулбар, когда верх контейнера редактора проходит под низ навбара,
      // и отпускаем, когда контейнер вернулся выше (или вышли за низ контейнера)
      const shouldFix = (wrapRect.top <= navBottom) && (wrapRect.bottom > navBottom);

      setToolbarFixed(shouldFix);
      if (shouldFix) {
        setToolbarWidth(wrapRect.width);
        setToolbarLeft(wrapRect.left);
        setToolbarHeight(tbH);
        setToolbarTop(navBottom);
      } else {
        setToolbarTop(0);
      }
    };
    window.addEventListener('scroll', onScrollOrResize, { passive: true } as any);
    window.addEventListener('resize', onScrollOrResize);
    // начальный расчет
    onScrollOrResize();
    return () => {
      window.removeEventListener('scroll', onScrollOrResize as any);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, []);

  const handleFormat = (command: string, value?: string) => {
    // Сохраняем текущее выделение
    const selection = window.getSelection();
    const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    
    // Специальная обработка для некоторых команд
    if (command === 'heading') {
      // Для заголовков используем другой подход
      const tag = value || 'h1';
      if (selection && !selection.isCollapsed) {
        // Если есть выделение, оборачиваем в тег
        const selectedText = selection.toString();
        const element = document.createElement(tag);
        element.textContent = selectedText;
        range?.deleteContents();
        range?.insertNode(element);
      } else {
        // Если нет выделения, создаем новый заголовок
        const element = document.createElement(tag);
        element.textContent = 'Заголовок';
        range?.insertNode(element);
      }
    } else if (command === 'paragraph') {
      // Для параграфов
      if (selection && !selection.isCollapsed) {
        document.execCommand('formatBlock', false, 'p');
      }
    } else {
      // Стандартные команды
      document.execCommand(command, false, value);
    }
    
    // Возвращаем фокус и восстанавливаем выделение
    if (editorRef.current) {
      editorRef.current.focus();
      if (range && selection) {
        try {
          selection.removeAllRanges();
          selection.addRange(range);
        } catch (e) {
          // Игнорируем ошибки восстановления выделения
        }
      }
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleInsertImage = () => {
    // Ensure editor focused
    editorRef.current?.focus();
    const url = prompt('Введите URL изображения:');
    if (url) {
      const img = document.createElement('img');
      img.src = url;
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.alt = 'Изображение';
      
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.insertNode(img);
        range.collapse(false);
      } else if (editorRef.current) {
        editorRef.current.appendChild(img);
      }
      // запомним последнюю картинку для управления выравниванием
      lastImageRef.current = img;
      
      if (editorRef.current) {
        setContent(editorRef.current.innerHTML);
      }
    }
  };

  // Helpers: получить текущую картинку (последняя выбранная/кликнутая или из селекшна)
  const getCurrentImage = (): HTMLImageElement | null => {
    if (lastImageRef.current) return lastImageRef.current;
    const sel = window.getSelection();
    if (sel && sel.anchorNode) {
      const node = sel.anchorNode as Node;
      const el = (node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement) as Element | null;
      const img = el?.closest('img');
      if (img) return img as HTMLImageElement;
    }
    return null;
  };

  const alignImageLeft = () => {
    const img = getCurrentImage();
    if (!img) return;
    img.style.display = '';
    img.style.margin = '0 1rem 1rem 0';
    img.style.float = 'left';
  };
  const alignImageCenter = () => {
    const img = getCurrentImage();
    if (!img) return;
    img.style.float = 'none';
    img.style.display = 'block';
    img.style.margin = '1rem auto';
  };
  const alignImageRight = () => {
    const img = getCurrentImage();
    if (!img) return;
    img.style.display = '';
    img.style.margin = '0 0 1rem 1rem';
    img.style.float = 'right';
  };
  const resetImageAlignment = () => {
    const img = getCurrentImage();
    if (!img) return;
    img.style.float = '';
    img.style.display = '';
    img.style.margin = '';
  };

  const handleSave = () => {
    if (editorRef.current) {
      onSave(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    // Просто обновляем состояние без вмешательства в DOM
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  return (
    <div ref={wrapperRef} className="bg-white rounded-lg shadow-lg p-6 relative">
      {/* Spacer to prevent layout shift when toolbar becomes fixed */}
      {toolbarFixed && (
        <div style={{ height: toolbarHeight || 0 }} />
      )}
      {/* Toolbar */}
      <div ref={toolbarRef} className={`flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 rounded border ${toolbarFixed ? 'fixed z-[100] shadow-lg bg-white' : 'sticky z-50 bg-white/80 backdrop-blur'}`} style={toolbarFixed ? { width: toolbarWidth, left: toolbarLeft, top: toolbarTop } : { top: toolbarTop }} >
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()} // Предотвращаем потерю фокуса
          onClick={() => handleFormat('bold')}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-100 font-bold"
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleFormat('italic')}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-100 italic"
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleFormat('underline')}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-100 underline"
          title="Underline"
        >
          U
        </button>
        
        <div className="w-px bg-gray-300 mx-1"></div>
        
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleFormat('heading', 'h1')}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-100 text-lg font-bold"
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleFormat('heading', 'h2')}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-100 text-base font-bold"
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleFormat('heading', 'h3')}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-100 text-sm font-bold"
          title="Heading 3"
        >
          H3
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleFormat('paragraph')}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-100"
          title="Paragraph"
        >
          P
        </button>
        
        <div className="w-px bg-gray-300 mx-1"></div>
        
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleFormat('insertUnorderedList')}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-100"
          title="Bullet List"
        >
          • List
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleFormat('insertOrderedList')}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-100"
          title="Numbered List"
        >
          1. List
        </button>
        
        <div className="w-px bg-gray-300 mx-1"></div>
        
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleFormat('justifyLeft')}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-100"
          title="Align Left"
        >
          ←
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleFormat('justifyCenter')}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-100"
          title="Align Center"
        >
          ↔
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleFormat('justifyRight')}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-100"
          title="Align Right"
        >
          →
        </button>
        
        <div className="w-px bg-gray-300 mx-1"></div>
        
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleInsertImage}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-100"
          title="Insert Image"
        >
          🖼️
        </button>

        {/* Image alignment controls */}
        <div className="w-px bg-gray-300 mx-1"></div>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={alignImageLeft}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-100"
          title="Картинка слева"
        >
          ⬅️🖼️
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={alignImageCenter}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-100"
          title="Картинка по центру"
        >
          ⬆️🖼️⬇️
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={alignImageRight}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-100"
          title="Картинка справа"
        >
          🖼️➡️
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={resetImageAlignment}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-100"
          title="Сбросить позиционирование"
        >
          ♻️
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onClick={(e)=>{
          const t = e.target as HTMLElement;
          if (t && t.tagName === 'IMG') {
            lastImageRef.current = t as HTMLImageElement;
          }
        }}
        className="prose prose-neutral max-w-none min-h-[60vh] p-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        style={{
          lineHeight: '1.7',
          fontSize: '16px'
        }}
        suppressContentEditableWarning={true}
      />

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
        >
          Отмена
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-6 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
        >
          Сохранить
        </button>
      </div>
    </div>
  );
}