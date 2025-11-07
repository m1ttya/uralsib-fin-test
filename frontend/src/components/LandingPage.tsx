type Props = {
  onShowLoginModal: () => void;
  onStartTest: () => void;
};

import { useEffect } from 'react';
import NavBar from './NavBar';
import HeroSection from './sections/HeroSection';
import PersonasSection from './sections/PersonasSection';
import TrainingSection from './sections/TrainingSection';
import AboutSection from './sections/AboutSection';
import GameSection from './sections/GameSection';
import { ENABLE_GAME } from '../config';
import Footer from './sections/Footer';

export default function LandingPage({ onShowLoginModal, onStartTest }: Props) {
  // Handle hash navigation on page load
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash) return;

      const target = document.getElementById(hash);
      if (!target) return;

      // Small delay to ensure page is fully loaded
      setTimeout(() => {
        const topBarH = (document.getElementById('navbar-inner')?.offsetHeight ?? 64);
        const headerH = topBarH + 12;
        const rect = target.getBoundingClientRect();
        const y = rect.top + window.scrollY - headerH;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }, 100);
    };

    // Check hash on initial load
    if (window.location.hash) {
      handleHashChange();
    }

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div className="min-h-screen w-full">
      <NavBar onShowLoginModal={onShowLoginModal} />
      <HeroSection onStartTest={onStartTest} />
      <PersonasSection />
      <TrainingSection />
      <AboutSection />
      {ENABLE_GAME && <GameSection />}
      <Footer />
    </div>
  );
}
