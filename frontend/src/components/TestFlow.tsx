import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QuestionCard from './QuestionCard';
import ResultsView from './ResultsView';
import CloseButton from './CloseButton';

import ExitConfirmModal from './ExitConfirmModal';

type FlowState = 'categories' | 'test' | 'results';

type BackendQuestion = { id: string; text: string; options: string[] };
type BackendTest = { id: string; title: string; category: string; variant: string; questions: BackendQuestion[] };

type Props = {
  onRestart: () => void;
};

export default function TestFlow({ onRestart }: Props) {
  const STORAGE_KEY = 'testFlowState_v1';
  const restoredRef = (typeof window !== 'undefined') ? { current: false } as { current: boolean } : { current: false };

  const API_BASE = (import.meta as any).env?.VITE_API_URL || '';
  const [flowState, setFlowState] = useState<FlowState>('categories');
  const [selectedTest, setSelectedTest] = useState<BackendTest | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showAgeGroups, setShowAgeGroups] = useState(false);
  const [showTestSelection, setShowTestSelection] = useState(false);
  const [availableTests, setAvailableTests] = useState<Array<{ id: string; title: string; category: string; variant: string }>>([]);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [answerPending, setAnswerPending] = useState(false);

  // Restore persisted state on mount
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data) return;
      if (data.flowState) setFlowState(data.flowState as FlowState);
      if (data.selectedTest) setSelectedTest(data.selectedTest as BackendTest);
      if (Array.isArray(data.answers)) setAnswers(data.answers as (number|null)[]);
      if (typeof data.currentQuestionIndex === 'number') setCurrentQuestionIndex(data.currentQuestionIndex);
      if (typeof data.showFeedback === 'boolean') setShowFeedback(data.showFeedback);
      if (typeof data.selectedOption === 'number' || data.selectedOption === null) setSelectedOption(data.selectedOption);
      if (Array.isArray(data.availableTests)) setAvailableTests(data.availableTests);
      if (typeof data.showAgeGroups === 'boolean') setShowAgeGroups(data.showAgeGroups);
      if (typeof data.showTestSelection === 'boolean') setShowTestSelection(data.showTestSelection);
      if (typeof data.progressPct === 'number') setProgressPct(data.progressPct);
      if (typeof data.sessionId === 'string') setSessionId(data.sessionId);
    } catch (e) { /* ignore */ }
  }, []);

  // Persist critical state whenever it changes
  useEffect(() => {
    try {
      const payload = {
        flowState,
        selectedTest,
        currentQuestionIndex,
        answers,
        showFeedback,
        selectedOption,
        showAgeGroups,
        showTestSelection,
        availableTests,
        progressPct,
        sessionId,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) { /* ignore */ }
  }, [flowState, selectedTest, currentQuestionIndex, answers, showFeedback, selectedOption, showAgeGroups, showTestSelection, availableTests, progressPct, sessionId]);

  const [categories, setCategories] = useState<Array<{ id: string; name: string; icon?: string }>>([
    { id: 'school', name: 'Школьники', icon: '📚' },
    { id: 'adults', name: 'Взрослые', icon: '👔' },
    { id: 'seniors', name: 'Пенсионеры', icon: '👴' }
  ]);

  useEffect(() => {
    // подгружаем категории тестов с бэкенда и объединяем с дефолтными
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/tests/categories`);
        if (!res.ok) return; // остаёмся на дефолтном наборе, если ошибка
        const items = await res.json();
        // items: [{ key, title }]
        // маппинг: school, adults, seniors уже есть; новые категории добавляем с иконкой по умолчанию
        const base = [
          { id: 'school', name: 'Школьники', icon: '📚' },
          { id: 'adults', name: 'Взрослые', icon: '👔' },
          { id: 'seniors', name: 'Пенсионеры', icon: '👴' }
        ];
        const mapped = items.map((it: any) => ({ id: it.key, name: it.title }));
        // объединяем, заменяя name у базовых, если ключ совпал
        const map = new Map(base.map(b => [b.id, { ...b }]));
        for (const it of mapped) {
          if (map.has(it.id)) map.set(it.id, { ...map.get(it.id)!, name: it.name });
          else map.set(it.id, { id: it.id, name: it.name, icon: '🧩' });
        }
        setCategories(Array.from(map.values()));
      } catch {}
    };
    load();
  }, []);


  const ageGroups = [
    { id: '5-10', name: '5-10 лет', icon: '🎨' },
    { id: '11-14', name: '11-14 лет', icon: '📖' },
    { id: '15-18', name: '15-18 лет', icon: '🎓' }
  ];


  const startBackendTest = async (testId: string) => {
    const url = `${API_BASE}/api/tests/${testId}/start?v=${Date.now()}`;
    const res = await fetch(url as any, { method: 'POST', cache: 'no-store' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || 'Failed to start test');
    }
    const data = await res.json();
    setSessionId(data.sessionId as string);
    const test = data.test as BackendTest;
    const next: any = { ...test, __correctByQ: {} as Record<string, number> };
    setSelectedTest(next as BackendTest);
    setAnswers(Array((data.test as BackendTest).questions.length).fill(null));
    setCurrentQuestionIndex(0);
    setFlowState('test');
  };

  const handleCategoryClick = async (categoryId: string) => {
    if (categoryId === 'school') {
      // Check if we have non-level tests in children category to show choice
      const res = await fetch(`${API_BASE}/api/tests?v=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const tests: Array<{ id: string; category: string; variant: string }> = (data?.tests || []);
        const childrenTests = tests.filter(t => t.category === 'children');
        const nonLevelTests = childrenTests.filter(t => !t.variant.startsWith('level_'));
        
        if (nonLevelTests.length > 0) {
          // Show test selection instead of age groups if we have non-level tests
          setShowTestSelection(true);
          setAvailableTests(childrenTests);
          return;
        }
      }
      setShowAgeGroups(true);
      return;
    }
    // Try to start 'general' by convention; if not found, fetch available tests and pick a suitable one.
    const preferredId = categoryId === 'adults' ? 'adults_general' : categoryId === 'seniors' ? 'pensioners_general' : `${categoryId}_general`;
    try {
      await startBackendTest(preferredId);
      return;
    } catch (e:any) {
      // Fallback: discover tests and start the first available in this category
      const res = await fetch(`${API_BASE}/api/tests`);
      if (!res.ok) {
        const msg = await res.text().catch(()=> 'Не удалось загрузить список тестов');
        alert(msg);
        return;
      }
      const data = await res.json();
      const aliasToFolder: Record<string,string> = { seniors: 'pensioners', school: 'children' };
      const folder = aliasToFolder[categoryId] || categoryId;
      const tests: Array<{ id: string; category: string; variant: string }> = (data?.tests || []);
      const inCat = tests.filter(t => {
        const cat = t.category || '';
        return cat === folder || cat === categoryId || cat.startsWith(`${folder}_`);
      });
      if (inCat.length > 0) {
        const general = inCat.find(t => t.variant === 'general') || inCat[0];
        try {
          await startBackendTest(general.id);
          return;
        } catch (e:any) {
          alert(e?.message || 'Не удалось запустить тест');
          return;
        }
      }
      alert('Нет доступных тестов в выбранной категории');
    }
  };

  const handleAgeGroupSelect = async (ageGroup: string) => {
    // map UI age group to backend children level
    const variant = ageGroup === '5-10' ? 'level_1' : ageGroup === '11-14' ? 'level_2' : 'level_3';
    const preferredId = `children_${variant}`;
    try {
      await startBackendTest(preferredId);
      return;
    } catch (e:any) {
      // Fallback: discover any available test in children category
      const res = await fetch(`${API_BASE}/api/tests`);
      if (res.ok) {
        const data = await res.json();
        const tests: Array<{ id: string; category: string; variant: string }> = (data?.tests || []);
        const inChildren = tests.filter(t => t.category === 'children' || t.category === 'school');
        if (inChildren.length > 0) {
          const general = inChildren.find(t => t.variant === 'general') || inChildren[0];
          await startBackendTest(general.id);
          return;
        }
      }
      alert('Нет доступных тестов в категории Школьники');
    }
  };

  const handleOptionSelect = (index: number) => {
    if (showFeedback || answerPending) return;
    setSelectedOption(index);
    // Ask backend which option is correct in shuffled order, then show feedback
    if (selectedTest && sessionId) {
      const q = selectedTest.questions[currentQuestionIndex];
      setAnswerPending(true);
      fetch((`${API_BASE}/api/tests/${selectedTest.id}/answer?v=${Date.now()}`).replace(/^\/+/, '') as any, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ sessionId, questionId: q.id, selectedIndex: index })
      })
        .then(async (res) => {
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data?.error || 'Failed to check answer');
          if (typeof data.correctOptionIndex === 'number') {
            const next = { ...selectedTest } as any;
            if (!next.__correctByQ) next.__correctByQ = {};
            next.__correctByQ[q.id] = data.correctOptionIndex;
            if (!next.__explanationByQ) next.__explanationByQ = {};
            next.__explanationByQ[q.id] = data.explanationForSelected || (q as any).correctExplanation || '';
            setSelectedTest(next);
          }
          setShowFeedback(true);
        })
        .catch((e) => {
          alert((e as Error).message);
          setSelectedOption(null);
        })
        .finally(() => setAnswerPending(false));
    }
  };

  const handleNext = () => {
    if (selectedOption !== null && selectedTest) {
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = selectedOption;
      setAnswers(newAnswers);
      if (currentQuestionIndex < selectedTest.questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedOption(null);
        setShowFeedback(false);
      } else {
        // Animate progress to 100% before showing results
        setProgressPct(100);
        setTimeout(() => {
          setFlowState('results');
        }, 600);
      }
    }
  };

  const handleRestartFlow = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}

    setFlowState('categories');
    setSelectedTest(null);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setShowFeedback(false);
    setSelectedOption(null);
    setShowAgeGroups(false);
    setShowTestSelection(false);
    setAvailableTests([]);
  };

  const handleCloseClick = () => setShowExitConfirm(true);
  const handleConfirmExit = () => { setShowExitConfirm(false); try { localStorage.removeItem(STORAGE_KEY); } catch {} onRestart(); };
  const handleCancelExit = () => setShowExitConfirm(false);

 // Track if article ("Развитие") is opened inside results view
 const [articleOpen, setArticleOpen] = useState(false);

 const currentQuestion = selectedTest?.questions[currentQuestionIndex];

  // Sync progress with current question index
  useEffect(() => {
    if (selectedTest) {
      const pct = (currentQuestionIndex / selectedTest.questions.length) * 100;
      setProgressPct(pct);
    } else {
      setProgressPct(0);
    }
  }, [currentQuestionIndex, selectedTest]);

  return (
    <div className="modal-overlay">
      <motion.div
        layout
        transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1.0] }}
        style={{ willChange: 'width, height', width: flowState === 'results' ? 'min(1200px, 98vw)' : 'min(960px, 94vw)' }}
        className={`${flowState === 'categories' ? 'category-modal-paper' : flowState === 'results' ? 'results-modal-paper' : 'test-modal-paper'} flex flex-col relative min-h-0 overflow-visible`}
      >
        {((flowState === 'results' && !articleOpen) || flowState === 'test' || flowState === 'categories') && (
          <CloseButton onClick={handleCloseClick} isWhite={flowState === 'results'} />
        )}

        {/* Логотип */}
        {flowState !== 'results' && (
          <div className="flex justify-center py-4 sm:py-6 md:py-8 px-4 sm:px-6 md:px-8">
            <img src="./uralsib_logo.svg" alt="Банк Уралсиб" className="h-8 sm:h-9 md:h-10 lg:h-11 w-auto" />
          </div>
        )}

        {/* Прогресс-бар для экрана теста */}
        {flowState === 'test' && selectedTest && (
          <div className="w-full bg-gray-200 h-2.5 mb-6 progress-bar-container relative z-20" style={{ marginLeft: 0, marginRight: 0 }}>
            <div
              className="bg-primary h-2.5"
              style={{ width: `${progressPct}%`, transition: 'width 0.6s ease-out' }}
            />
          </div>
        )}

        {flowState === 'test' && selectedTest && (
          <p className="text-sm sm:text-base md:text-lg text-gray-500 mb-6 sm:mb-8 text-center px-4 sm:px-6 md:px-8 premium-text">
            Вопрос {currentQuestionIndex + 1} из {selectedTest.questions.length}
          </p>
        )}

        {/* Контент */}
        <div className={`flex-1 ${flowState === 'results' ? '' : 'px-4 sm:px-6 md:px-8 pb-40 sm:pb-6 md:pb-8'}`}>
          <AnimatePresence mode="wait">
            {flowState === 'results' ? (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1.0] }}
                className="w-full"
                style={{ willChange: 'opacity' }}
              >
                {selectedTest && (
                  <div className="w-full">
                      <ResultsView test={selectedTest as any} answers={answers} correctByQ={(selectedTest as any).__correctByQ} onRestart={handleRestartFlow} onToggleArticle={(open)=>setArticleOpen(!!open)} />
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key={flowState === 'categories' ? `categories-${showAgeGroups ? 'age' : 'cat'}` : `test-${currentQuestionIndex}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1.0] }}
                className="w-full"
                style={{ willChange: 'opacity' }}
              >
                {flowState === 'categories' ? (
                  <>
                    <AnimatePresence mode="wait">
                      <motion.h3
                        key={showAgeGroups ? 'age-title' : showTestSelection ? 'test-title' : 'cat-title'}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.24, ease: [0.25, 0.1, 0.25, 1.0] }}
                        className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-center text-gray-800 mb-4 sm:mb-6 md:mb-8"
                        style={{
                          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                          fontWeight: 700,
                          letterSpacing: '-0.02em',
                          lineHeight: '1.1'
                        }}
                      >
                        {!showAgeGroups && !showTestSelection ? 'Выберите категорию' : showAgeGroups ? 'Выберите возрастную группу' : 'Выберите тест'}
                      </motion.h3>
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                      {!showAgeGroups && !showTestSelection ? (
                        <motion.div
                          key="cat-grid"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.24, ease: [0.25, 0.1, 0.25, 1.0] }}
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 w-full"
                        >
                          {categories.map(category => (
                            <motion.button
                              key={category.id}
                              whileHover={{ scale: 1.05, transition: { duration: 0.15 } }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleCategoryClick(category.id)}
                              className="w-full max-w-[360px] mx-auto sm:max-w-none p-4 sm:p-6 md:p-8 lg:p-10 rounded-3xl bg-white transition-all duration-300 text-center flex flex-col items-center justify-center min-h-[140px] sm:min-h-[150px] md:min-h-[180px] lg:min-h-[200px] shadow-lg hover:shadow-2xl hover:shadow-button-primary/20"
                              style={{ width: window.innerWidth < 640 ? 'min(360px, calc(100vw - 32px))' : undefined }}
                            >
                              <div className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl mb-3 sm:mb-4 md:mb-6 flex items-center justify-center">{category.icon}</div>
                              <div className="premium-text text-gray-800 text-lg sm:text-lg md:text-xl lg:text-2xl text-center font-semibold">{category.name}</div>
                            </motion.button>
                          ))}
                        </motion.div>
                      ) : showAgeGroups ? (
                        <motion.div
                          key="age-grid"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.24, ease: [0.25, 0.1, 0.25, 1.0] }}
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 w-full"
                        >
                          {ageGroups.map(ageGroup => (
                            <motion.button
                              key={ageGroup.id}
                              whileHover={{ scale: 1.05, transition: { duration: 0.15 } }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleAgeGroupSelect(ageGroup.id)}
                              className="w-full max-w-[360px] mx-auto sm:max-w-none p-4 sm:p-6 md:p-8 lg:p-10 rounded-3xl bg-white transition-all duration-300 text-center flex flex-col items-center justify-center min-h-[140px] sm:min-h-[150px] md:min-h-[180px] lg:min-h-[200px] shadow-lg hover:shadow-2xl hover:shadow-button-primary/20"
                              style={{ width: window.innerWidth < 640 ? 'min(360px, calc(100vw - 32px))' : undefined }}
                            >
                              <div className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl mb-3 sm:mb-4 md:mb-6 flex items-center justify-center">{ageGroup.icon}</div>
                              <div className="premium-text text-gray-800 text-lg sm:text-lg md:text-xl lg:text-2xl text-center font-semibold">{ageGroup.name}</div>
                            </motion.button>
                          ))}
                        </motion.div>
                      ) : (
                        <motion.div
                          key="test-grid"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.24, ease: [0.25, 0.1, 0.25, 1.0] }}
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 w-full"
                        >
                          {availableTests.map(test => {
                            const getTestIcon = (variant: string) => {
                              if (variant === 'level_1') return '🎨';
                              if (variant === 'level_2') return '📖';
                              if (variant === 'level_3') return '🎓';
                              return '🧩';
                            };
                            
                            const getTestName = (variant: string, title: string) => {
                              if (variant === 'level_1') return '5-10 лет';
                              if (variant === 'level_2') return '11-14 лет';
                              if (variant === 'level_3') return '15-18 лет';
                              return title.replace(/^(Школьники|Взрослые|Пенсионеры)\s*[—-]\s*/, '');
                            };
                            
                            return (
                              <motion.button
                                key={test.id}
                                whileHover={{ scale: 1.05, transition: { duration: 0.15 } }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => startBackendTest(test.id)}
                                className="w-full max-w-[360px] mx-auto sm:max-w-none p-4 sm:p-6 md:p-8 lg:p-10 rounded-3xl bg-white transition-all duration-300 text-center flex flex-col items-center justify-center min-h-[140px] sm:min-h-[150px] md:min-h-[180px] lg:min-h-[200px] shadow-lg hover:shadow-2xl hover:shadow-button-primary/20"
                                style={{ width: window.innerWidth < 640 ? 'min(360px, calc(100vw - 32px))' : undefined }}
                              >
                                <div className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl mb-3 sm:mb-4 md:mb-6 flex items-center justify-center">
                                  {getTestIcon(test.variant)}
                                </div>
                                <div className="premium-text text-gray-800 text-lg sm:text-lg md:text-xl lg:text-2xl text-center font-semibold">
                                  {getTestName(test.variant, test.title)}
                                </div>
                              </motion.button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  selectedTest && currentQuestion && (
                    <QuestionCard
                      key={currentQuestionIndex}
                      question={currentQuestion.text}
                      options={currentQuestion.options}
                      selectedOption={selectedOption}
                      onOptionSelect={handleOptionSelect}
                      showFeedback={showFeedback}
                      correctShuffledIndex={(selectedTest as any).__correctByQ?.[currentQuestion.id]}
                      explanation={(selectedTest as any).__explanationByQ?.[currentQuestion.id]}
                      onNext={handleNext}
                      canProceed={selectedOption !== null && showFeedback}
                    />
                  )
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Глобальная мобильная кнопка Далее, вне анимируемого контента, чтобы не мигала */}
          {flowState === 'test' && (
            <div
              className="fixed inset-x-0 z-30 sm:hidden pointer-events-none"
              style={{ bottom: `calc(env(safe-area-inset-bottom, 0px) + 84px)` }}
            >
              <div className="flex justify-center items-center w-full">
                <motion.button
                  whileTap={selectedOption !== null ? { scale: 0.95 } : {}}
                  onClick={handleNext}
                  disabled={selectedOption === null}
                  className={`pointer-events-auto w-14 h-14 rounded-full premium-button transition-all duration-500 shadow-lg flex items-center justify-center ${
                    selectedOption !== null
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-300'
                  }`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.button>
              </div>
            </div>
          )}
          
        </div>
      </motion.div>

      <ExitConfirmModal isOpen={showExitConfirm} onClose={handleCancelExit} onConfirmExit={handleConfirmExit} />
    </div>
  );
}

 
