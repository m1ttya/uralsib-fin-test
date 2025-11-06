import React, { useState, useRef, useEffect } from 'react';

interface ArticleEditorProps {
  initialContent?: string;
  onSave: (content: string) => void;
  onCancel: () => void;
}

// Icons for text alignment (Word-style)
const AlignLeftIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M3 4H15V6H3V4ZM3 10H21V12H3V10ZM3 16H19V18H3V16Z" />
  </svg>
);

const AlignCenterIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M3 4H21V6H3V4ZM5 10H19V12H5V10ZM7 16H17V18H7V16Z" />
  </svg>
);

const AlignRightIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M9 4H21V6H9V4ZM3 10H21V12H3V10ZM5 16H21V18H5V16Z" />
  </svg>
);

const AlignJustifyIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M2 4H22V6H2V4ZM2 10H22V12H2V10ZM2 16H22V18H2V16Z" />
  </svg>
);

// Icons for lists (Word-style)
const BulletListIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <circle cx="7" cy="7" r="2" fill="currentColor" />
    <rect x="12" y="6" width="10" height="2" rx="1" />
    <circle cx="7" cy="16" r="2" fill="currentColor" />
    <rect x="12" y="15" width="10" height="2" rx="1" />
  </svg>
);

const NumberedListIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <text x="4" y="7" fontSize="8" fill="currentColor" fontWeight="bold">1.</text>
    <rect x="12" y="6" width="10" height="2" rx="1" />
    <text x="4" y="16" fontSize="8" fill="currentColor" fontWeight="bold">2.</text>
    <rect x="12" y="15" width="10" height="2" rx="1" />
  </svg>
);

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
  const savedSelectionRef = useRef<Range | null>(null);

  // Устанавливаем начальное содержимое в редактор
  useEffect(() => {
    if (editorRef.current && initialContent) {
      editorRef.current.innerHTML = initialContent;
      setContent(initialContent);
    }
  }, [initialContent]);

  // Отслеживаем изменения выделения для обновления поля размера шрифта
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleSelectionChange = () => {
      const selection = window.getSelection();
      const fontSizeInput = document.querySelector('input[type="number"][min="8"][max="72"]') as HTMLInputElement;
      if (fontSizeInput && document.activeElement !== fontSizeInput) {
        if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
          const size = getCurrentFontSize();
          if (size) {
            fontSizeInput.value = String(size);
          } else {
            fontSizeInput.value = '';
          }
        } else {
          fontSizeInput.value = '';
        }
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  // Глобальный обработчик для колеса мыши над полем размера шрифта
  useEffect(() => {
    const fontSizeInput = document.querySelector('input[type="number"][min="8"][max="72"]') as HTMLInputElement;

    const handleWheel = (e: WheelEvent) => {
      if (document.activeElement === fontSizeInput) {
        e.preventDefault();
        // Сохраняем выделение перед изменением размера
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          savedSelectionRef.current = selection.getRangeAt(0);
        }
        // Получаем текущий размер выделенного текста или используем значение из поля
        let currentSize = getCurrentFontSize();
        if (!currentSize) {
          const fieldValue = parseInt(fontSizeInput.value || '0');
          if (fieldValue > 0) {
            currentSize = fieldValue;
          } else {
            currentSize = 16; // размер по умолчанию
          }
        }

        const delta = e.deltaY > 0 ? -1 : 1;
        const newValue = Math.max(8, Math.min(72, currentSize + delta));

        // Обновляем поле и применяем размер
        fontSizeInput.value = String(newValue);
        applyFontSize(newValue);
        // Восстанавливаем выделение после применения размера
        if (savedSelectionRef.current && editorRef.current) {
          const newSelection = window.getSelection();
          if (newSelection) {
            newSelection.removeAllRanges();
            newSelection.addRange(savedSelectionRef.current);
          }
        }
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      document.removeEventListener('wheel', handleWheel);
    };
  }, []);

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
    if (command === 'heading') {
      // Для заголовков сначала очищаем предыдущее форматирование
      const tag = value || 'h1';

      // Очищаем все стили перед применением заголовка
      document.execCommand('removeFormat', false);
      document.execCommand('unlink', false);

      // Применяем заголовок
      document.execCommand('formatBlock', false, tag);
    } else if (command === 'paragraph') {
      // Для параграфов
      document.execCommand('formatBlock', false, 'p');
    } else if (command === 'fontSize') {
      // Изменение размера шрифта по пунктам
      const size = parseInt(value || '16');
      applyFontSize(size);
    } else {
      // Стандартные команды (bold, italic, underline, etc.)
      document.execCommand(command, false, value);
    }

    // Обновляем содержимое
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  // Функция для получения текущего размера шрифта выделенного текста
  const getCurrentFontSize = (): number | null => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      return null;
    }

    const range = selection.getRangeAt(0);
    // Проверяем, находится ли выделение внутри редактора
    if (!editorRef.current?.contains(range.commonAncestorContainer)) {
      return null;
    }

    const selectedText = range.toString();
    if (!selectedText) return null;

    // Создаем временный элемент и копируем стили от родителя
    const tempSpan = document.createElement('span');
    tempSpan.textContent = selectedText;
    tempSpan.style.visibility = 'hidden';
    tempSpan.style.position = 'absolute';
    tempSpan.style.whiteSpace = 'nowrap';

    // Копируем стили от родительского элемента
    const parentElement = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
      ? (range.commonAncestorContainer.parentElement as Element)
      : (range.commonAncestorContainer as Element);

    const parentStyle = window.getComputedStyle(parentElement);
    tempSpan.style.fontFamily = parentStyle.fontFamily;
    tempSpan.style.fontWeight = parentStyle.fontWeight;
    tempSpan.style.fontStyle = parentStyle.fontStyle;

    range.insertNode(tempSpan);

    // Получаем вычисленный размер шрифта
    const computedStyle = window.getComputedStyle(tempSpan);
    const fontSize = computedStyle.fontSize;
    const size = parseInt(fontSize);

    tempSpan.remove();

    return isNaN(size) ? null : size;
  };

  // Функция для применения размера шрифта с сохранением выделения
  const applyFontSize = (size: number) => {
    // Сохраняем выделение
    const selection = window.getSelection();
    const hasSelection = selection && !selection.isCollapsed;
    if (!hasSelection) return;

    const savedRange = selection!.rangeCount > 0 ? selection!.getRangeAt(0) : null;

    // Применяем форматирование
    document.execCommand('fontSize', false, String(size));
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }

    // Восстанавливаем выделение
    if (savedRange && editorRef.current) {
      const newSelection = window.getSelection();
      if (newSelection) {
        try {
          const newRange = document.createRange();
          newRange.setStart(savedRange.startContainer, savedRange.startOffset);
          newRange.setEnd(savedRange.endContainer, savedRange.endOffset);
          newSelection.removeAllRanges();
          newSelection.addRange(newRange);
        } catch (e) {
          // Игнорируем ошибки
        }
      }
    }

    // Возвращаем фокус в редактор
    setTimeout(() => editorRef.current?.focus(), 0);
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
    <div ref={wrapperRef} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative">
      {/* Spacer to prevent layout shift when toolbar becomes fixed */}
      {toolbarFixed && (
        <div style={{ height: toolbarHeight || 0 }} />
      )}
      {/* Toolbar */}
      <div ref={toolbarRef} className={`flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 rounded-lg border ${toolbarFixed ? 'fixed z-[100] shadow-lg bg-white' : 'sticky z-50 bg-white/80 backdrop-blur'}`} style={toolbarFixed ? { width: toolbarWidth, left: toolbarLeft, top: toolbarTop } : { top: toolbarTop }} >
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()} // Предотвращаем потерю фокуса
          onClick={() => handleFormat('bold')}
          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 font-bold text-sm"
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleFormat('italic')}
          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 italic text-sm"
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleFormat('underline')}
          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 underline text-sm"
          title="Underline"
        >
          U
        </button>

        <div className="w-px bg-gray-300 mx-1"></div>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleFormat('heading', 'h1')}
          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 text-base font-bold"
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleFormat('heading', 'h2')}
          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 text-sm font-bold"
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleFormat('heading', 'h3')}
          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 text-sm font-bold"
          title="Heading 3"
        >
          H3
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleFormat('paragraph')}
          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 text-sm"
          title="Paragraph"
        >
          P
        </button>

        <div className="w-px bg-gray-300 mx-1"></div>

        {/* Font size control */}
        <input
          type="number"
          min="8"
          max="72"
          placeholder="?"
          onFocus={(e) => {
            // Сохраняем текущее выделение ДО потери фокуса редактором
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              savedSelectionRef.current = selection.getRangeAt(0);
            }
            // Показываем размер выделенного текста
            const size = getCurrentFontSize();
            if (size) {
              e.currentTarget.value = String(size);
            }
          }}
          onBlur={(e) => {
            // Восстанавливаем выделение в редакторе
            if (savedSelectionRef.current && editorRef.current) {
              const newSelection = window.getSelection();
              if (newSelection) {
                newSelection.removeAllRanges();
                newSelection.addRange(savedSelectionRef.current);
              }
            }
            // Очищаем ссылку на сохраненное выделение
            savedSelectionRef.current = null;
            // Очищаем поле если нет выделения
            const selection = window.getSelection();
            if (!selection || selection.isCollapsed) {
              e.currentTarget.value = '';
            }
          }}
          onInput={(e) => {
            const target = e.target as HTMLInputElement;
            const value = target.value.trim();
            if (value === '') {
              // Пустое значение - не применяем размер
              return;
            }
            const size = parseInt(value);
            if (size >= 8 && size <= 72) {
              // Сохраняем выделение перед изменением размера
              const selection = window.getSelection();
              if (selection && selection.rangeCount > 0) {
                savedSelectionRef.current = selection.getRangeAt(0);
              }
              applyFontSize(size);
              // Восстанавливаем выделение после применения размера
              if (savedSelectionRef.current && editorRef.current) {
                const newSelection = window.getSelection();
                if (newSelection) {
                  newSelection.removeAllRanges();
                  newSelection.addRange(savedSelectionRef.current);
                }
              }
            }
          }}
          onKeyDown={(e) => {
            // Поддержка стрелок вверх/вниз для изменения размера
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault();
              // Сохраняем выделение перед изменением размера
              const selection = window.getSelection();
              if (selection && selection.rangeCount > 0) {
                savedSelectionRef.current = selection.getRangeAt(0);
              }
              // Получаем текущий размер выделенного текста
              let currentSize = getCurrentFontSize();
              if (!currentSize) {
                const fieldValue = parseInt(e.currentTarget.value || '0');
                if (fieldValue > 0) {
                  currentSize = fieldValue;
                } else {
                  currentSize = 16; // размер по умолчанию
                }
              }

              const delta = e.key === 'ArrowUp' ? 1 : -1;
              const newValue = Math.max(8, Math.min(72, currentSize + delta));

              // Обновляем поле и применяем размер
              e.currentTarget.value = String(newValue);
              applyFontSize(newValue);
              // Восстанавливаем выделение после применения размера
              if (savedSelectionRef.current && editorRef.current) {
                const newSelection = window.getSelection();
                if (newSelection) {
                  newSelection.removeAllRanges();
                  newSelection.addRange(savedSelectionRef.current);
                }
              }
            }
          }}
          className="w-20 px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/20"
          title="Размер шрифта (пункты) - используйте колесо мыши или стрелки на клавиатуре, или введите число от 8 до 72"
        />

        <div className="w-px bg-gray-300 mx-1"></div>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleFormat('insertUnorderedList')}
          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 text-sm inline-flex items-center justify-center"
          title="Bullet List"
        >
          <BulletListIcon />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleFormat('insertOrderedList')}
          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 text-sm inline-flex items-center justify-center"
          title="Numbered List"
        >
          <NumberedListIcon />
        </button>

        <div className="w-px bg-gray-300 mx-1"></div>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleFormat('justifyLeft')}
          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 text-sm inline-flex items-center justify-center"
          title="Align Left"
        >
          <AlignLeftIcon />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleFormat('justifyCenter')}
          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 text-sm inline-flex items-center justify-center"
          title="Align Center"
        >
          <AlignCenterIcon />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleFormat('justifyRight')}
          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 text-sm inline-flex items-center justify-center"
          title="Align Right"
        >
          <AlignRightIcon />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleFormat('justifyFull')}
          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 text-sm inline-flex items-center justify-center"
          title="Align Justify"
        >
          <AlignJustifyIcon />
        </button>

        <div className="w-px bg-gray-300 mx-1"></div>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleInsertImage}
          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 text-sm"
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
          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 text-sm"
          title="Картинка слева"
        >
          ⬅️🖼️
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={alignImageCenter}
          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 text-sm"
          title="Картинка по центру"
        >
          ⬆️🖼️⬇️
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={alignImageRight}
          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 text-sm"
          title="Картинка справа"
        >
          🖼️➡️
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={resetImageAlignment}
          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 text-sm"
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
        className="prose prose-neutral max-w-none min-h-[60vh] p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
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
          className="px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Отмена
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 text-white bg-primary rounded-lg hover:bg-secondary transition-colors"
        >
          Сохранить
        </button>
      </div>
    </div>
  );
}