import { useEffect, useState, useContext } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import LoginModal from './components/LoginModal';
import TestFlow from './components/TestFlow';
import AdminPanel from './components/admin/AdminPanel';
import BackgroundParallax from './components/BackgroundParallaxNew';
import AdminGate from './components/admin/AdminGate';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import PrivateRoute from './components/auth/PrivateRoute';
import PersonalCabinet from './pages/PersonalCabinet';

function AppContent() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginFromStartTest, setLoginFromStartTest] = useState(false);

  // Always start at the very top on initial mount and disable browser scroll restoration
  useEffect(() => {
    try { (history as any).scrollRestoration = 'manual'; } catch {}
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  const handleStartTest = () => {
    // Если пользователь авторизован, сразу переходим к тесту
    if (user) {
      navigate('/test');
    } else {
      // Если не авторизован, показываем модал логина
      setLoginFromStartTest(true);
      setLoginOpen(true);
    }
  };

  const handleShowLogin = () => {
    // Показываем модал логина (например, при нажатии на "Войти" в навигации)
    setLoginFromStartTest(false);
    setLoginOpen(true);
  };

  const handleCloseLogin = () => {
    setLoginOpen(false);
    setLoginFromStartTest(false);
  };

  const handleSkipAuth = () => {
    // Переходим к тесту без авторизации (в той же вкладке)
    window.location.href = '/test';
  };

  return (
    <div className="min-h-screen w-full relative" style={{ zIndex: 1 }}>
      <BackgroundParallax />
      <Routes>
        <Route
          path="/"
          element={<LandingPage onShowLoginModal={handleShowLogin} onStartTest={handleStartTest} />}
        />
        <Route
          path="/test"
          element={<TestFlow onRestart={() => navigate('/')} />}
        />
        <Route
          path="/admin"
          element={
            <AdminGate>
              <AdminPanel />
            </AdminGate>
          }
        />
        <Route
          path="/cabinet"
          element={
            <PrivateRoute>
              <PersonalCabinet />
            </PrivateRoute>
          }
        />
      </Routes>

      <LoginModal
        isOpen={loginOpen}
        onClose={handleCloseLogin}
        onSkip={handleSkipAuth}
        fromStartTest={loginFromStartTest}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;