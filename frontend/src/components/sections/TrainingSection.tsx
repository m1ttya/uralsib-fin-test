import ArticlesSection from './ArticlesSection';
import CoursesSection from './CoursesSection';

export default function TrainingSection() {
  return (
    <section id="training" className="py-10 md:py-16 scroll-mt-24">
      <div className="container mx-auto px-4">
        {/* На мобильных - последовательно, на десктопе - 2 колонки */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Статьи секция */}
          <div>
            <h2 className="text-2xl md:text-4xl font-bold text-primary text-center mb-10">Статьи</h2>
            <ArticlesSection />
          </div>

          {/* Курсы секция */}
          <div>
            <h2 className="text-2xl md:text-4xl font-bold text-primary text-center mb-10">Курсы</h2>
            <CoursesSection />
          </div>
        </div>
      </div>
    </section>
  );
}
