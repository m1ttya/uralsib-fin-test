export default function CTASection({ onStart }: { onStart: () => void }) {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        <h3 className="text-2xl md:text-3xl font-bold text-primary mb-4">Готовы начать?</h3>
        <p className="text-gray-700 mb-8">Пройдите тест и получите персональные рекомендации</p>
        <button onClick={onStart} className="px-10 py-5 rounded-full bg-primary text-white hover:bg-secondary shadow-lg">Начать</button>
      </div>
    </section>
  );
}
