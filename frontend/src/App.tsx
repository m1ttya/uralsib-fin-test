import { useEffect, useState } from 'react';
import LandingPage from './components/LandingPage';
import LoginModal from './components/LoginModal';
import TestFlow from './components/TestFlow';
import AdminPanel from './components/admin/AdminPanel';
import BackgroundParallax from './components/BackgroundParallaxNew';
import AdminGate from './components/admin/AdminGate';

type AppState = 'landing' | 'test-flow' | 'admin';

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

  const [loginOpen, setLoginOpen] = useState(false);

  const handleStartTest = () => {
    setLoginOpen(true);
  };

  const handleLogin = () => {
    alert('Авторизация через банк пока в разработке');
    // Не перекидываем к категориям, остаемся в модальном окне
  };

  const handleSkip = () => {
    // Переходим к тесту, не размонтируя лэндинг
    setLoginOpen(false);
    setAppState('test-flow');
  };

  const handleCloseLogin = () => {
    setLoginOpen(false);
  };

  const handleRestart = () => {
    setAppState('landing');
  };


  const renderCurrentState = () => {
    switch (appState) {
      case 'landing':
        return <LandingPage onStartTest={handleStartTest} />;
      
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
    <div className="min-h-screen w-full relative" style={{ zIndex: 1 }}>
      {appState !== 'admin' && (
        <BackgroundParallax />
      )}
      {renderCurrentState()}
      {appState !== 'admin' && (
        <LoginModal
          isOpen={loginOpen}
          onClose={handleCloseLogin}
          onLogin={handleLogin}
          onSkip={handleSkip}
        />
      )}
    </div>
  );
}

export default App;