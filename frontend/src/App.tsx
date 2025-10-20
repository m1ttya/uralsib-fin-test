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
    // Сначала закрываем модальное окно входа плавно
    // Затем сразу переходим к тесту без задержки
    setAppState('test-flow');
  };

  const handleCloseLogin = () => {
    setAppState('landing');
  };

  const handleRestart = () => {
    setAppState('landing');
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
      
      case 'test-flow':
        return <TestFlow onRestart={handleRestart} />;
      
      default:
        return <LandingPage onStartTest={handleStartTest} />;
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col">
      <div className="flex-1">
        {renderCurrentState()}
      </div>
    </div>
  );
}

export default App;