import { motion } from 'framer-motion';

export default function HeroSection({ onStart }: { onStart: () => void }) {
  return (
    <section id="home" className="pt-0 pb-12 md:pt-4 md:pb-20 scroll-mt-24">
      <div className="container mx-auto px-4 max-w-5xl text-center">
        <motion.img initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.05,duration:0.6}} src={`${import.meta.env.BASE_URL}assets/img/1_image7.png`} alt="Уралсиб" className="mx-auto -mt-8 md:-mt-16 mb-3 h-72 md:h-96 lg:h-[32rem] w-auto"/>

        <motion.h1 initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.6}} className="text-4xl md:text-6xl font-bold text-primary mb-6">
          <span>Проверьте свою</span><span className="md:hidden"> </span><br className="hidden md:block" />
          <span>финансовую грамотность</span>
        </motion.h1>
        <motion.p initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1,duration:0.6}} className="text-xl md:text-2xl text-gray-700 mb-10">
          Это не займет много времени!
        </motion.p>
        <motion.button initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2,duration:0.6}} whileHover={{scale:1.02, transition:{ duration: 0.12 }}} whileTap={{scale:0.98, transition:{ duration: 0.08 }}} onClick={onStart} className="px-10 py-5 rounded-full text-white shadow-lg bg-gradient-to-r from-primary to-secondary [background-size:200%_100%] [background-position:0_0] hover:[background-position:100%_0] transition-[background-position] duration-500 ease-out">
          Начать тест
        </motion.button>
      </div>
    </section>
  );
}
