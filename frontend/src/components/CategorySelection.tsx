import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Props = {
  onCategorySelect: (category: string, ageGroup?: string) => void;
};

export default function CategorySelection({ onCategorySelect }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAgeGroups, setShowAgeGroups] = useState(false);

  const categories = [
    { id: 'school', name: 'Школьники', icon: '📚' },
    { id: 'adults', name: 'Взрослые', icon: '👔' },
    { id: 'seniors', name: 'Пенсионеры', icon: '👴' }
  ];

  const ageGroups = [
    { id: '5-10', name: '5-10 лет', icon: '🎨' },
    { id: '11-14', name: '11-14 лет', icon: '📖' },
    { id: '15-18', name: '15-18 лет', icon: '🎓' }
  ];

  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === 'school') {
      setSelectedCategory(categoryId);
      setShowAgeGroups(true);
    } else {
      onCategorySelect(categoryId);
    }
  };

  const handleAgeGroupSelect = (ageGroup: string) => {
    onCategorySelect(selectedCategory!, ageGroup);
  };

  return (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="modal-overlay"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="category-modal-paper flex flex-col relative"
              >
        {/* Логотип в верхней части */}
        <div className="flex justify-center py-4 sm:py-6 md:py-8 px-4 sm:px-6 md:px-8">
          <img 
            src="./uralsib_logo.svg" 
            alt="Банк Уралсиб" 
            className="h-8 sm:h-9 md:h-10 lg:h-11 w-auto"
          />
        </div>


        <AnimatePresence mode="wait">
          {!showAgeGroups ? (
            <motion.div 
              key="categories"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="w-full px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8"
            >
                <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-center text-gray-800 mb-4 sm:mb-6 md:mb-8" style={{
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                  fontWeight: '700',
                  letterSpacing: '-0.02em',
                  lineHeight: '1.1'
                }}>
                  Выберите категорию
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 w-full">
                        {categories.map((category) => (
                          <motion.button
                            key={category.id}
                            whileHover={{ 
                              scale: 1.05,
                              transition: { duration: 0.15 }
                            }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleCategoryClick(category.id)}
                            className="p-4 sm:p-6 md:p-8 lg:p-10 rounded-3xl bg-white transition-all duration-300 text-center flex flex-col items-center justify-center min-h-[120px] sm:min-h-[150px] md:min-h-[180px] lg:min-h-[200px] shadow-lg hover:shadow-2xl hover:shadow-button-primary/20"
                          >
                            <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl mb-3 sm:mb-4 md:mb-6 flex items-center justify-center">{category.icon}</div>
                            <div className="premium-text text-gray-800 text-base sm:text-lg md:text-xl lg:text-2xl text-center font-semibold">{category.name}</div>
                          </motion.button>
                        ))}
                </div>
            </motion.div>
          ) : (
            <motion.div 
              key="ageGroups"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="w-full px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8"
            >
                <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-center text-gray-800 mb-4 sm:mb-6 md:mb-8" style={{
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                  fontWeight: '700',
                  letterSpacing: '-0.02em',
                  lineHeight: '1.1'
                }}>
                  Выберите возрастную группу
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 w-full">
                  {ageGroups.map((ageGroup) => (
                    <motion.button
                      key={ageGroup.id}
                      whileHover={{ 
                        scale: 1.05,
                        transition: { duration: 0.15 }
                      }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAgeGroupSelect(ageGroup.id)}
                      className="p-4 sm:p-6 md:p-8 lg:p-10 rounded-3xl bg-white transition-all duration-300 text-center flex flex-col items-center justify-center min-h-[120px] sm:min-h-[150px] md:min-h-[180px] lg:min-h-[200px] shadow-lg hover:shadow-2xl hover:shadow-button-primary/20"
                    >
                      <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl mb-3 sm:mb-4 md:mb-6 flex items-center justify-center">{ageGroup.icon}</div>
                      <div className="premium-text text-gray-800 text-base sm:text-lg md:text-xl lg:text-2xl text-center font-semibold">{ageGroup.name}</div>
                    </motion.button>
                  ))}
                </div>
            </motion.div>
          )}
        </AnimatePresence>
        
              </motion.div>
            </motion.div>
  );
}
