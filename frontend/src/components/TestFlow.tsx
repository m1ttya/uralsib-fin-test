import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QuestionCard from './QuestionCard';
import ResultsView from './ResultsView';
import CloseButton from './CloseButton';
import ExitConfirmModal from './ExitConfirmModal';
type FlowState = 'categories' | 'test' | 'results';

type BackendQuestion = { id: string; text: string; options: string[]; correctIndex?: number };
type BackendTest = { id: string; title: string; category: string; variant: string; questions: BackendQuestion[] };

type Props = {
  onRestart: () => void;
};

export default function TestFlow({ onRestart }: Props) {
  const [flowState, setFlowState] = useState<FlowState>('categories');
  const [selectedTest, setSelectedTest] = useState<BackendTest | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showAgeGroups, setShowAgeGroups] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [answerPending, setAnswerPending] = useState(false);

  const categories = [
    { id: 'school', name: 'Школьники', icon: '📚' },
    { id: 'adults', name: 'Взрослые', icon: '👔' },
    { id: 'seniors', name: 'Пенсионеры', icon: '👴' }
  ];

  const ageGroups = [
    { id: '5-10', name: '5-10 лет', icon: '🎨' },
    { id: '11-14', name: '11-14 лет', icon: '📖' },
    { id: '15-18', name: '15-18 лет', icon: '🎓' }
  ];

  // load tests metadata once
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/tests');
        await res.json();
      } catch {
        //
      }
    };
    load();
  }, []);

  const startBackendTest = async (testId: string) => {
    try {
      const res = await fetch(`/api/tests/${testId}/start`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Failed to start test');
      }
      const data = await res.json();
      setSessionId(data.sessionId as string);
      const test = data.test as BackendTest;
      // инициализируем структуру для хранения правильных индексов по вопросам
      const next: any = { ...test, __correctByQ: {} as Record<string, number> };
      setSelectedTest(next as BackendTest);
      setAnswers(Array((data.test as BackendTest).questions.length).fill(null));
      setCurrentQuestionIndex(0);
      setFlowState('test');
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === 'school') {
      setShowAgeGroups(true);
      return;
    }
    // adults -> adults_general; seniors -> pensioners_general
    const testId = categoryId === 'adults' ? 'adults_general' : 'pensioners_general';
    startBackendTest(testId);
  };

  const handleAgeGroupSelect = (ageGroup: string) => {
    // map UI age group to backend children level
    const variant = ageGroup === '5-10' ? 'level_1' : ageGroup === '11-14' ? 'level_2' : 'level_3';
    const testId = `children_${variant}`;
    startBackendTest(testId);
  };

  const handleOptionSelect = (index: number) => {
    if (showFeedback || answerPending) return;
    setSelectedOption(index);
    // Ask backend which option is correct in shuffled order, then show feedback
    if (selectedTest && sessionId) {
      const q = selectedTest.questions[currentQuestionIndex];
      setAnswerPending(true);
      fetch(`/api/tests/${selectedTest.id}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, questionId: q.id, selectedIndex: index })
      })
        .then(async (res) => {
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data?.error || 'Failed to check answer');
          if (typeof data.correctOptionIndex === 'number') {
            const next = { ...selectedTest } as any;
            if (!next.__correctByQ) next.__correctByQ = {};
            next.__correctByQ[q.id] = data.correctOptionIndex;
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
    setFlowState('categories');
    setSelectedTest(null);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setShowFeedback(false);
    setSelectedOption(null);
    setShowAgeGroups(false);
  };

  const handleCloseClick = () => setShowExitConfirm(true);
  const handleConfirmExit = () => { setShowExitConfirm(false); onRestart(); };
  const handleCancelExit = () => setShowExitConfirm(false);

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
      <motion.div layout transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1.0] }} style={{ willChange: 'width, height' }} className={`${flowState === 'categories' ? 'category-modal-paper' : flowState === 'results' ? 'results-modal-paper' : 'test-modal-paper'} w-full flex flex-col relative`}>
        <CloseButton onClick={handleCloseClick} />

        {/* Логотип */}
        <div className="flex justify-center py-4 sm:py-6 md:py-8 px-4 sm:px-6 md:px-8">
          <img src="./uralsib_logo.svg" alt="Банк Уралсиб" className="h-8 sm:h-9 md:h-10 lg:h-11 w-auto" />
        </div>

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
        <div className="flex-1 px-4 sm:px-6 md:px-8 pb-40 sm:pb-6 md:pb-8">
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
                      <ResultsView test={selectedTest as any} answers={answers} correctByQ={(selectedTest as any).__correctByQ} onRestart={handleRestartFlow} />
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
                        key={showAgeGroups ? 'age-title' : 'cat-title'}
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
                        {!showAgeGroups ? 'Выберите категорию' : 'Выберите возрастную группу'}
                      </motion.h3>
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                      {!showAgeGroups ? (
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
                      ) : (
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
                      correctIndex={currentQuestion.correctIndex}
                      correctShuffledIndex={(selectedTest as any).__correctByQ?.[currentQuestion.id]}
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

 
