// Игра в стиле Papers Please
import PapersPleaseGame from '../PapersPleaseGame';

const GameSection = () => {
  // Игра Papers Please - основная игра
  return (
    <section id="game" className="py-12 md:py-20 scroll-mt-24">
      <div className="container mx-auto px-4 max-w-5xl">
        <PapersPleaseGame />
      </div>
    </section>
  );
};

export default GameSection;