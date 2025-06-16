import { motion } from 'framer-motion';

const DiceFace = ({ value, isRolling = false, className = '' }) => {
  const getDots = (num) => {
    const dotPatterns = {
      1: [[1, 1]],
      2: [[0, 0], [2, 2]],
      3: [[0, 0], [1, 1], [2, 2]],
      4: [[0, 0], [0, 2], [2, 0], [2, 2]],
      5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
      6: [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]]
    };
    
    return dotPatterns[num] || [];
  };

  return (
    <motion.div
      animate={isRolling ? {
        rotateX: [0, 360, 720],
        rotateY: [0, 180, 360],
      } : {}}
      transition={{
        duration: 0.6,
        ease: "easeOut"
      }}
      className={`dice-face w-24 h-24 md:w-32 md:h-32 bg-surface border-2 border-primary/30 rounded-xl relative shadow-lg ${className}`}
      style={{
        boxShadow: isRolling ? '0 0 30px rgba(255, 0, 110, 0.6)' : '0 0 15px rgba(255, 0, 110, 0.3)'
      }}
    >
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 p-2 gap-1">
        {Array.from({ length: 9 }, (_, index) => {
          const row = Math.floor(index / 3);
          const col = index % 3;
          const shouldShowDot = getDots(value).some(([r, c]) => r === row && c === col);
          
          return (
            <div key={index} className="flex items-center justify-center">
              {shouldShowDot && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: isRolling ? 0.6 : 0, duration: 0.2 }}
                  className="w-2 h-2 md:w-3 md:h-3 bg-primary rounded-full neon-glow"
                />
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default DiceFace;