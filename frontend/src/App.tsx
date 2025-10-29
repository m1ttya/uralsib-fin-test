import { useEffect, useState } from 'react';
import LandingPage from './components/LandingPage';
import LoginModal from './components/LoginModal';
import TestFlow from './components/TestFlow';
import AdminPanel from './components/admin/AdminPanel';
import AdminGate from './components/admin/AdminGate';

type AppState = 'landing' | 'login' | 'test-flow' | 'admin';

function App() {
  const [appState, setAppState] = useState<AppState>(() => (window.location.hash === '#admin' ? 'admin' : 'landing'));

  // keep appState in sync with hash
  useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash === '#admin') {
        setAppState('admin');
      } else if (window.location.hash === '') {
        setAppState('landing');
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

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
      case 'admin':
        return (
          <AdminGate>
            <AdminPanel />
          </AdminGate>
        );
      default:
        return <LandingPage onStartTest={handleStartTest} />;
    }
  };

  return (
    <div className="min-h-screen w-full">
      {renderCurrentState()}
    </div>
  );
}

export default App;