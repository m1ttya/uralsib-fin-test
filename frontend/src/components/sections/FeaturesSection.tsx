import { motion } from 'framer-motion';

const items = [
  { title: 'Коротко и по делу', text: '5–10 минут, без сложных терминов' },
  { title: 'Для всех возрастов', text: 'Школьники, взрослые, пенсионеры' },
  { title: 'Пояснения к ответам', text: 'Разбор ошибок и рекомендации' },
  { title: 'Материалы от экспертов', text: 'Подборка статей и гайдов' },
];

export default function FeaturesSection() {
  return (
    <section id="tests" className="py-12 md:py-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <h2 className="text-2xl md:text-4xl font-bold text-primary text-center mb-10">Как это работает</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((it, i) => (
            <motion.div key={it.title} initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true, amount:0.3}} transition={{delay:i*0.05}} className="p-7 md:p-8 rounded-2xl bg-white/70 backdrop-blur shadow-sm border border-white/60">
              <h3 className="font-bold text-primary mb-2 text-lg">{it.title}</h3>
              <p className="text-gray-700 text-base">{it.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
