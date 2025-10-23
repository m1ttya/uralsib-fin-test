import { motion } from 'framer-motion';

const personas = [
  {
    key: 'school',
    title: 'Школьники',
    text: 'Понять базовые финансовые понятия простым языком',
    img: `${import.meta.env.BASE_URL}assets/img/persona_school.png`,
  },
  {
    key: 'adults',
    title: 'Взрослые',
    text: 'Проверить уровень и закрыть пробелы в знаниях',
    img: `${import.meta.env.BASE_URL}assets/img/persona_adult.png`,
  },
  {
    key: 'seniors',
    title: 'Пенсионеры',
    text: 'Укрепить уверенность в управлении финансами',
    img: `${import.meta.env.BASE_URL}assets/img/persona_senior.png`,
  },
];

export default function PersonasSection() {
  return (
    <section id="tests" className="py-10 md:py-16 scroll-mt-24">
      <div className="container mx-auto px-4 max-w-6xl">
        <h2 className="text-2xl md:text-4xl font-bold text-primary text-center mb-10">Кому это подойдёт</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {personas.map((p, i) => (
            <motion.div
              key={p.key}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="rounded-3xl bg-white/70 backdrop-blur border border-white/60 shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="aspect-[4/3] w-full overflow-hidden">
                <img src={p.img} alt={p.title} className="w-full h-full object-cover"/>
              </div>
              <div className="p-6">
                <div className="font-bold text-gray-900 text-xl md:text-2xl mb-2">{p.title}</div>
                <div className="text-gray-700 text-base">{p.text}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
