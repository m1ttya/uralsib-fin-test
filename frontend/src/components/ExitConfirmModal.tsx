import { motion, AnimatePresence } from 'framer-motion';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExit: () => void;
};

export default function ExitConfirmModal({ isOpen, onClose, onConfirmExit }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
              Уже уходите?
            </h3>
            
            <p className="text-gray-600 mb-6 text-center">
              Вы уверены, что хотите покинуть тест?
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={onConfirmExit}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors duration-200 font-medium"
              >
                Уйти
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-primary text-white rounded-full hover:bg-secondary transition-colors duration-200 font-medium"
              >
                Остаться
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
