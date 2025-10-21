import { useState } from 'react';
import LandingPage from './components/LandingPage';
import LoginModal from './components/LoginModal';
import TestFlow from './components/TestFlow';

type AppState = 'landing' | 'login' | 'test-flow';

function App() {
  const [appState, setAppState] = useState<AppState>('landing');

  const handleStartTest = () => {
    setAppState('login');
  };

  const handleLogin = () => {
    alert('Авторизация через банк пока в разработке');
    // Не перекидываем к категориям, остаемся в модальном окне
  };

  const handleSkip = () => {
    setAppState('test-flow');
  };

  const handleCloseLogin = () => {
    setAppState('landing');
  };

  const handleRestart = () => {
    setAppState('landing');
  };

  // Определяет основное содержимое страницы
  const renderPageContent = () => {
    switch (appState) {
      case 'test-flow':
        return <TestFlow onRestart={handleRestart} />;
      
      // Для 'landing' и 'login' фоном является LandingPage
      case 'landing':
      case 'login':
      default:
        return <LandingPage onStartTest={handleStartTest} />;
    }
  };

  // Управляет стилями контейнера, включая блокировку прокрутки
  const getContainerClasses = () => {
    let classes = "min-h-screen w-full bg-gray-900 text-white";
    if (appState === 'test-flow') {
      classes += " flex flex-col items-center justify-center";
    }
    // Блокируем прокрутку, когда модальное окно открыто
    if (appState === 'login') {
      classes += " h-screen overflow-hidden";
    }
    return classes;
  };

  return (
    <div className={getContainerClasses()}>
      {renderPageContent()}
      <LoginModal
        isOpen={appState === 'login'}
        onClose={handleCloseLogin}
        onLogin={handleLogin}
        onSkip={handleSkip}
      />
    </div>
  );
}

export default App;