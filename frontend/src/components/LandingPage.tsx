import NavigationBar from './NavigationBar';
import HeroSection from './HeroSection';
import AboutSection from './AboutSection';
import FaqSection from './FaqSection';
import Footer from './Footer';

type Props = {
  onStartTest: () => void;
};

export default function LandingPage({ onStartTest }: Props) {
  return (
    <>
      <NavigationBar />
      <main>
        <HeroSection onStartTest={onStartTest} />
        <AboutSection />
        <FaqSection />
      </main>
      <Footer />
    </>
  );
}
