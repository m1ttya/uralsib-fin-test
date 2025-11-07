type Props = {
  onShowLoginModal: () => void;
  onStartTest: () => void;
};

import NavBar from './NavBar';
import HeroSection from './sections/HeroSection';
import PersonasSection from './sections/PersonasSection';
import TrainingSection from './sections/TrainingSection';
import AboutSection from './sections/AboutSection';
import GameSection from './sections/GameSection';
import { ENABLE_GAME } from '../config';
import Footer from './sections/Footer';

export default function LandingPage({ onShowLoginModal, onStartTest }: Props) {
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
