import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QuestionCard from './QuestionCard';
import ResultsView from './ResultsView';
import CloseButton from './CloseButton';

import ExitConfirmModal from './ExitConfirmModal';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

type FlowState = 'categories' | 'test' | 'results';

type BackendQuestion = { id: string; text: string; options: string[] };
type BackendTest = { id: string; title: string; category: string; variant: string; questions: BackendQuestion[] };

type Props = {
  onRestart: () => void;
};

export default function TestFlow({ onRestart }: Props) {
  const { isAuthenticated } = useAuth();
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
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

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
        const baseUrl = API_BASE?.replace(/\/+$/, '') || '';
        const res = await fetch(`${baseUrl}/api/tests/categories`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
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
    // Use Axios api instance to ensure authentication headers are included
    try {
      const res = await api.post(`/tests/${testId}/start`, {});
      const data = res.data;
      setSessionId(data.sessionId as string);
      const test = data.test as BackendTest;
      const next: any = { ...test, __correctByQ: {} as Record<string, number> };
      setSelectedTest(next as BackendTest);
      setAnswers(Array((data.test as BackendTest).questions.length).fill(null));
      setCurrentQuestionIndex(0);
      setFlowState('test');
    } catch (error: any) {
      // Log the full error for debugging
      console.error('Test start error:', error.response?.data || error.message);
      // Show the actual backend error message
      const errorMessage = error.response?.data?.error || error.message || 'Failed to start test';
      throw new Error(errorMessage);
    }
  };

  // Check if a test variant requires authentication (level-based tests)
  const isTestRestricted = (variant: string) => {
    return variant.startsWith('level_');
  };

  // Pre-calculate which tests are restricted - only recalculate when availableTests changes
  const availableTestsWithRestriction = useMemo(() => {
    return availableTests.map(test => ({
      ...test,
      isRestricted: isTestRestricted(test.variant)
    }));
  }, [availableTests]);

  const handleCategoryClick = async (categoryId: string) => {
    // Always fetch the full test list to work with
    const baseUrl = API_BASE?.replace(/\/+$/, '') || '';
    const res = await fetch(`${baseUrl}/api/tests`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (!res.ok) {
      const msg = await res.text().catch(()=> 'Не удалось загрузить список тестов');
      alert(msg);
      return;
    }
    const data = await res.json();
    const tests: Array<{ id: string; title: string; category: string; variant: string }> = (data?.tests || []);

    if (categoryId === 'school') {
      // For school: check if we have non-level tests in children category
      const childrenTests = tests.filter(t => t.category === 'children');
      const nonLevelTests = childrenTests.filter(t => !t.variant.startsWith('level_'));

      if (nonLevelTests.length > 0) {
        // Show test selection if we have non-level tests
        setShowTestSelection(true);
        setAvailableTests(childrenTests);
        setSelectedCategoryId('school');
      } else {
        // Otherwise show age groups
        setShowAgeGroups(true);
        setSelectedCategoryId(null);
      }
      return;
    }

    // For adults and seniors: show available tests from their folders
    const aliasToFolder: Record<string,string> = { seniors: 'pensioners' };
    const folder = aliasToFolder[categoryId] || categoryId;

    // Try multiple variations to find tests
    const inCat = tests.filter(t => {
      const cat = t.category || '';
      return cat === folder ||
             cat === categoryId ||
             cat.startsWith(`${folder}_`) ||
             (categoryId === 'adults' && (cat === 'adults' || cat.startsWith('adults_'))) ||
             (categoryId === 'seniors' && (cat === 'seniors' || cat.startsWith('seniors_')));
    });

    if (inCat.length > 0) {
      setShowTestSelection(true);
      setAvailableTests(inCat);
      setSelectedCategoryId(categoryId);
    } else {
      alert('Нет доступных тестов в выбранной категории');
      setSelectedCategoryId(null);
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
      const baseUrl = API_BASE?.replace(/\/+$/, '') || '';
      const res = await fetch(`${baseUrl}/api/tests`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (res.ok) {
        const data = await res.json();
        const tests: Array<{ id: string; title: string; category: string; variant: string }> = (data?.tests || []);
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

  const handleOptionSelect = async (index: number) => {
    if (showFeedback || answerPending) return;
    setSelectedOption(index);
    // Ask backend which option is correct in shuffled order, then show feedback
    if (selectedTest && sessionId) {
      const q = selectedTest.questions[currentQuestionIndex];
      setAnswerPending(true);

      try {
        // Small delay to ensure smooth UI transition
        await new Promise(resolve => setTimeout(resolve, 50));

        // Use Axios api instance for consistency
        const response = await api.post(`/tests/${selectedTest.id}/answer`, {
          sessionId,
          questionId: q.id,
          selectedIndex: index
        });

        const data = response.data;

        // Ensure state updates happen in a predictable order
        if (typeof data.correctOptionIndex === 'number') {
          setSelectedTest((prev: any) => {
            if (!prev) return prev;
            const next = { ...prev };
            if (!next.__correctByQ) next.__correctByQ = {};
            next.__correctByQ[q.id] = data.correctOptionIndex;
            if (!next.__explanationByQ) next.__explanationByQ = {};
            next.__explanationByQ[q.id] = data.explanationForSelected || (q as any).correctExplanation || '';
            return next;
          });
        }

        // Use RAF to ensure DOM update before showing feedback
        requestAnimationFrame(() => {
          setShowFeedback(true);
        });

      } catch (e) {
        alert((e as Error).message);
        setSelectedOption(null);
      } finally {
        setAnswerPending(false);
      }
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
    setSelectedCategoryId(null);
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
                          fontFamily: "'Uralsib-Regular', 'Uralsib', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
                          className="w-full"
                        >
                          {/* Строки по 3 элемента, каждая строка адаптируется под количество элементов в ней */}
                          {Array.from({ length: Math.ceil(categories.length / 3) }).map((_, rowIndex) => {
                            const rowItems = categories.slice(rowIndex * 3, rowIndex * 3 + 3);
                            const itemCount = rowItems.length;

                            // Определяем классы сетки в зависимости от количества элементов в строке
                            const getGridClasses = (count: number) => {
                              if (count === 1) return 'grid-cols-1';
                              if (count === 2) return 'grid-cols-1 sm:grid-cols-2';
                              return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
                            };

                            return (
                              <div
                                key={rowIndex}
                                className={`grid ${getGridClasses(itemCount)} gap-3 sm:gap-4 md:gap-6 w-full ${rowIndex > 0 ? 'mt-3 sm:mt-4 md:mt-6' : ''}`}
                              >
                                {rowItems.map(category => (
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
                              </div>
                            );
                          })}
                        </motion.div>
                      ) : showAgeGroups ? (
                        <motion.div
                          key="age-grid"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.24, ease: [0.25, 0.1, 0.25, 1.0] }}
                          className="w-full"
                        >
                          {/* Строки по 3 элемента, каждая строка адаптируется под количество элементов в ней */}
                          {Array.from({ length: Math.ceil(ageGroups.length / 3) }).map((_, rowIndex) => {
                            const rowItems = ageGroups.slice(rowIndex * 3, rowIndex * 3 + 3);
                            const itemCount = rowItems.length;

                            // Определяем классы сетки в зависимости от количества элементов в строке
                            const getGridClasses = (count: number) => {
                              if (count === 1) return 'grid-cols-1';
                              if (count === 2) return 'grid-cols-1 sm:grid-cols-2';
                              return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
                            };

                            return (
                              <div
                                key={rowIndex}
                                className={`grid ${getGridClasses(itemCount)} gap-3 sm:gap-4 md:gap-6 w-full ${rowIndex > 0 ? 'mt-3 sm:mt-4 md:mt-6' : ''}`}
                              >
                                {rowItems.map(ageGroup => (
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
                              </div>
                            );
                          })}
                        </motion.div>
                      ) : (
                        <motion.div
                          key="test-grid"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.24, ease: [0.25, 0.1, 0.25, 1.0] }}
                          className="w-full"
                        >
                          <div className="w-full">
                            {/* Строки по 3 элемента, каждая строка адаптируется под количество элементов в ней */}
                            {Array.from({ length: Math.ceil(availableTestsWithRestriction.length / 3) }).map((_, rowIndex) => {
                              const rowItems = availableTestsWithRestriction.slice(rowIndex * 3, rowIndex * 3 + 3);
                              const itemCount = rowItems.length;

                              // Определяем классы сетки в зависимости от количества элементов в строке
                              const getGridClasses = (count: number) => {
                                if (count === 1) return 'grid-cols-1';
                                if (count === 2) return 'grid-cols-1 sm:grid-cols-2';
                                return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
                              };

                              const getTestIcon = (variant: string) => {
                                if (selectedCategoryId === 'school') {
                                  if (variant === 'level_1') return '🎨';
                                  if (variant === 'level_2') return '📖';
                                  if (variant === 'level_3') return '🎓';
                                }
                                return '🧩';
                              };

                              const getTestName = (variant: string, title: string) => {
                                if (selectedCategoryId === 'school') {
                                  // For school: show age groups for level tests
                                  if (variant === 'level_1') return '5-10 лет';
                                  if (variant === 'level_2') return '11-14 лет';
                                  if (variant === 'level_3') return '15-18 лет';
                                } else {
                                  // For adults and seniors: use different naming for level tests
                                  if (variant === 'level_1') return 'Базовый тест';
                                  if (variant === 'level_2') return 'Средний тест';
                                  if (variant === 'level_3') return 'Продвинутый тест';
                                }
                                return title.replace(/^(Школьники|Взрослые|Пенсионеры)\s*[—-]\s*/, '');
                              };

                              return (
                                <div
                                  key={rowIndex}
                                  className={`grid ${getGridClasses(itemCount)} gap-3 sm:gap-4 md:gap-6 w-full ${rowIndex > 0 ? 'mt-3 sm:mt-4 md:mt-6' : ''}`}
                                >
                                  {rowItems.map((test) => {
                                    const showLock = test.isRestricted && !isAuthenticated;

                                    if (showLock) {
                                      return (
                                        <div
                                          key={test.id}
                                          className="w-full max-w-[360px] mx-auto sm:max-w-none p-4 sm:p-6 md:p-8 lg:p-10 rounded-3xl bg-gray-50 transition-all duration-300 text-center flex flex-col items-center justify-center min-h-[140px] sm:min-h-[150px] md:min-h-[180px] lg:min-h-[200px] shadow-md border-2 border-dashed border-gray-300"
                                          style={{ width: window.innerWidth < 640 ? 'min(360px, calc(100vw - 32px))' : undefined }}
                                        >
                                          <div className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl mb-3 sm:mb-4 md:mb-6 flex items-center justify-center relative">
                                            <div className="opacity-60 grayscale">
                                              {getTestIcon(test.variant)}
                                            </div>
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                              <img
                                                src="./assets/img/3_image20.png"
                                                alt="Заблокировано"
                                                className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 opacity-90"
                                              />
                                            </div>
                                          </div>
                                          <div className="premium-text text-gray-600 text-lg sm:text-lg md:text-xl lg:text-2xl text-center font-semibold">
                                            {getTestName(test.variant, test.title)}
                                          </div>
                                          <div className="mt-2 text-xs sm:text-sm text-gray-500">
                                            Требуется вход
                                          </div>
                                        </div>
                                      );
                                    }

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
                                </div>
                              );
                            })}
                          </div>
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

      {/* Кнопка Далее для больших экранов - выходит за правый край окна теста */}
      {flowState === 'test' && selectedTest && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1.0], delay: 0.32 }}
          className="hidden sm:block"
          style={{ position: 'fixed', right: 'calc(50vw - 480px - 28px)', top: '50%', transform: 'translateY(-50%)', zIndex: 100 }}
        >
          <motion.button
            whileTap={(selectedOption !== null && showFeedback) ? { scale: 0.95 } : {}}
            onClick={handleNext}
            disabled={!(selectedOption !== null && showFeedback)}
            className={`w-14 h-14 rounded-full premium-button transition-all duration-500 shadow-xl flex items-center justify-center ${
              (selectedOption !== null && showFeedback)
                ? 'bg-primary text-white hover:bg-secondary hover:shadow-2xl'
                : 'bg-gray-100 text-gray-300'
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="transition-transform duration-300 w-5 h-5"
            >
              <path
                d="M9 18L15 12L9 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.button>
        </motion.div>
      )}

      <ExitConfirmModal isOpen={showExitConfirm} onClose={handleCancelExit} onConfirmExit={handleConfirmExit} />
    </div>
  );
}

 
