import { useState } from 'react';
import LandingPage from './components/LandingPage';
import LoginModal from './components/LoginModal';
import CategorySelection from './components/CategorySelection';
import TestPlayer from './components/TestPlayer';
import { mockTests } from './data/mockTests';

type AppState = 'landing' | 'login' | 'categories' | 'test' | 'results';

function App() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>('');

  const handleStartTest = () => {
    setAppState('login');
  };

  const handleLogin = () => {
    alert('Авторизация через банк пока в разработке');
    // Не перекидываем к категориям, остаемся в модальном окне
  };

  const handleSkip = () => {
    // Сначала закрываем модальное окно входа плавно
    // Затем сразу переходим к категориям без задержки
    setAppState('categories');
  };

  const handleCloseLogin = () => {
    setAppState('landing');
  };

  const handleCategorySelect = (category: string, ageGroup?: string) => {
    setSelectedCategory(category);
    if (ageGroup) {
      setSelectedAgeGroup(ageGroup);
    }
    setAppState('test');
  };

  // Функция для получения правильного теста
  const getSelectedTest = () => {
    if (selectedCategory === 'school' && selectedAgeGroup) {
      return mockTests.find(test => test.category === 'school' && test.ageGroup === selectedAgeGroup);
    } else if (selectedCategory === 'adults') {
      return mockTests.find(test => test.category === 'adults');
    } else if (selectedCategory === 'seniors') {
      return mockTests.find(test => test.category === 'seniors');
    }
    // Fallback на тест для взрослых
    return mockTests.find(test => test.category === 'adults');
  };


  const renderCurrentState = () => {
    switch (appState) {
      case 'landing':
        return <LandingPage onStartTest={handleStartTest} />;
      
      case 'login':
        return (
          <>
            <LandingPage onStartTest={handleStartTest} />
            <LoginModal
              isOpen={true}
              onClose={handleCloseLogin}
              onLogin={handleLogin}
              onSkip={handleSkip}
            />
          </>
        );
      
      case 'categories':
        return <CategorySelection onCategorySelect={handleCategorySelect} />;
      
      case 'test':
        return <TestPlayer test={getSelectedTest() || mockTests[0]} onRestart={() => setAppState('landing')} />;
      
      case 'results':
        return <TestPlayer test={getSelectedTest() || mockTests[0]} onRestart={() => setAppState('landing')} />;
      
      default:
        return <LandingPage onStartTest={handleStartTest} />;
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col">
      <div className="flex-1 flex items-stretch justify-center sm:items-center sm:justify-center">
        {renderCurrentState()}
      </div>
      
      {/* Общий копирайт внизу */}
      <div className="fixed bottom-2 left-0 right-0 text-center z-[9999] px-4">
        <a 
          href="https://uralsib.ru/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-gray-600 transition-colors duration-200 text-xs premium-text"
        >
          © 2005-2025 ПАО «Банк Уралсиб»
        </a>
      </div>
    </div>
  );
}

export default App;