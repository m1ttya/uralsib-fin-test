import { motion } from 'framer-motion';

type Props = {
  onStartTest: () => void;
};

export default function LandingPage({ onStartTest }: Props) {
  return (
    <div className="landing-page min-h-screen w-full flex flex-col items-center justify-center sm:justify-start py-0 sm:py-8 md:py-12 lg:py-16 xl:py-20 2xl:py-24 px-4 sm:px-6 md:px-8 lg:px-12">
      {/* Логотип */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-6 sm:mb-2 md:mb-4 lg:mb-6 relative"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 via-pink-400/20 to-purple-600/20 rounded-full blur-xl glow-animation"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-400/15 via-purple-500/15 to-pink-400/15 rounded-full blur-2xl glow-rotate"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-cyan-400/10 via-purple-400/10 to-pink-400/10 rounded-full blur-3xl glow-animation" style={{animationDelay: '2s'}}></div>
          <img 
            src="./uralsib_logo_square.svg" 
            alt="Банк Уралсиб" 
            className="w-56 h-56 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 xl:w-64 xl:h-64 2xl:w-72 2xl:h-72 relative z-10 drop-shadow-2xl"
          />
        </div>
      </motion.div>

      {/* Заголовок */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-4xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl premium-heading text-center text-gray-800 mb-14 sm:mb-6 md:mb-8 lg:mb-10 lg:mb-12 max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl px-2 sm:px-4"
      >
        <span className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-clip-text text-transparent">
          Проверьте свою<br />
          финансовую грамотность
        </span>
      </motion.h1>

      {/* Кнопка - с viewport units для лучшего масштабирования */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        onClick={onStartTest}
        className="relative bg-gradient-to-r from-purple-800 to-purple-900 text-white rounded-full premium-button shadow-lg hover:shadow-purple-800/25 hover:from-purple-700 hover:to-purple-800 mb-12 sm:mb-8 md:mb-12 lg:mb-16 xl:mb-20 2xl:mb-24 overflow-hidden group flex items-center justify-center whitespace-nowrap"
        style={{
          padding: window.innerWidth < 640 ? '20px 60px' : '18px 36px',
          fontSize: window.innerWidth < 640 ? '22px' : '20px',
          minHeight: window.innerWidth < 640 ? '64px' : '60px',
          maxWidth: window.innerWidth < 640 ? '360px' : '260px'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
        <span className="relative z-10">Пройти тест</span>
      </motion.button>

    </div>
  );
}
