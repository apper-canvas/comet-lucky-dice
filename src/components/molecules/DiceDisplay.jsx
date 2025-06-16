import { motion } from 'framer-motion';
import DiceFace from '@/components/atoms/DiceFace';

const DiceDisplay = ({ dice1, dice2, isRolling, total }) => {
  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Dice Container */}
      <div className="flex items-center justify-center space-x-6 md:space-x-8">
        <DiceFace value={dice1} isRolling={isRolling} />
        <DiceFace value={dice2} isRolling={isRolling} />
      </div>
      
      {/* Total Display */}
      <motion.div
        key={total}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-surface/50 backdrop-blur-sm border-2 border-accent/30 rounded-2xl px-8 py-4"
        style={{
          boxShadow: '0 0 20px rgba(255, 190, 11, 0.3)'
        }}
      >
        <div className="text-center">
          <p className="text-accent/80 font-heading text-sm md:text-base mb-1">TOTAL</p>
          <motion.p
            key={`total-${total}`}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.4 }}
            className="text-accent font-display text-4xl md:text-6xl font-bold neon-glow"
          >
            {total}
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
};

export default DiceDisplay;