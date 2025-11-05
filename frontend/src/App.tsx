import { useEffect, useState } from 'react';
import LandingPage from './components/LandingPage';
import LoginModal from './components/LoginModal';
import TestFlow from './components/TestFlow';
import AdminPanel from './components/admin/AdminPanel';
import BackgroundParallax from './components/BackgroundParallaxNew';
import AdminGate from './components/admin/AdminGate';

type AppState = 'landing' | 'test-flow' | 'admin';

function App() {
  const [appState, setAppState] = useState<AppState>(() => {
    if (window.location.hash === '#admin') return 'admin';
    try {
      const saved = localStorage.getItem('testFlowState_v1');
      if (saved) {
        const data = JSON.parse(saved);
        if (data && (data.flowState === 'categories' || data.flowState === 'test' || data.flowState === 'results')) {
          return 'test-flow';
        }
      }
    } catch {}
    return 'landing';
  });

  // Always start at the very top on initial mount and disable browser scroll restoration
  useEffect(() => {
    try { (history as any).scrollRestoration = 'manual'; } catch {}
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  // keep appState in sync with hash
  useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash === '#admin') {
        setAppState('admin');
        setLoginOpen(false); // Close login modal when entering admin
      } else if (window.location.hash === '') {
        setAppState('landing');
        setLoginOpen(false); // Close login modal when returning to landing
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