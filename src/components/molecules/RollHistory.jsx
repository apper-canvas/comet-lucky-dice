import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import ApperIcon from '@/components/ApperIcon';

const RollHistory = ({ rolls, onClear, players = [], gameMode = 'single' }) => {
  const getPlayerName = (playerId) => {
    const player = players.find(p => p.Id === playerId);
    return player ? player.name : 'Unknown';
  };

  if (!rolls || rolls.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface/30 backdrop-blur-sm rounded-2xl p-6 border border-primary/20 text-center"
      >
        <ApperIcon name="Dice1" className="w-12 h-12 text-primary/50 mx-auto mb-4" />
        <p className="text-primary/70 font-heading text-lg mb-2">No rolls yet!</p>
        <p className="text-white/60">
          {gameMode === 'multi' ? 'Players roll the dice to see history' : 'Roll the dice to see your history'}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface/30 backdrop-blur-sm rounded-2xl p-6 border border-primary/20"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-primary font-display text-xl">
          {gameMode === 'multi' ? 'Game History' : 'Roll History'}
        </h3>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClear}
          className="text-error hover:text-error/80 transition-colors p-2 rounded-lg hover:bg-error/10"
        >
          <ApperIcon name="Trash2" className="w-5 h-5" />
        </motion.button>
      </div>
      
      <div className="space-y-3 max-h-64 overflow-y-auto">
        <AnimatePresence>
          {rolls.map((roll, index) => (
            <motion.div
              key={roll.Id}
              initial={{ opacity: 0, x: -20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              transition={{ delay: index * 0.1 }}
              className="bg-background/50 rounded-lg p-3 border border-secondary/20 hover:border-secondary/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {gameMode === 'multi' && roll.playerId && (
                    <div className="flex-shrink-0">
                      <span className="text-xs text-primary/70 bg-primary/10 px-2 py-1 rounded-full">
                        {getPlayerName(roll.playerId)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-primary/20 rounded border border-primary/30 flex items-center justify-center">
                      <span className="text-primary text-xs font-bold">{roll.dice1}</span>
                    </div>
                    <div className="w-6 h-6 bg-primary/20 rounded border border-primary/30 flex items-center justify-center">
                      <span className="text-primary text-xs font-bold">{roll.dice2}</span>
                    </div>
                  </div>
                  <div className={`font-display text-lg font-bold ${
                    roll.total === 2 || roll.total === 12 ? 'text-error' : 'text-accent'
                  }`}>
                    = {roll.total}
                    {(roll.total === 2 || roll.total === 12) && gameMode === 'multi' && (
                      <span className="text-xs ml-1">⚠️</span>
                    )}
                  </div>
                </div>
                <div className="text-white/50 text-sm">
                  {format(new Date(roll.timestamp), 'HH:mm:ss')}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default RollHistory;