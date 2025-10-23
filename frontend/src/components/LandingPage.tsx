type Props = { onStartTest: () => void };

import NavBar from './NavBar';
import HeroSection from './sections/HeroSection';
import PersonasSection from './sections/PersonasSection';
import ArticlesSection from './sections/ArticlesSection';
import AboutSection from './sections/AboutSection';
import Footer from './sections/Footer';

export default function LandingPage({ onStartTest }: Props) {
  return (
    <div className="min-h-screen w-full">
      <NavBar onStart={onStartTest} />
      <HeroSection onStart={onStartTest} />
      <PersonasSection />
      <ArticlesSection />
      <AboutSection />
      <Footer />
    </div>
  );
}
