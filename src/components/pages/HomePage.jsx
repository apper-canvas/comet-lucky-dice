import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import Button from '@/components/atoms/Button';
import DiceDisplay from '@/components/molecules/DiceDisplay';
import RollHistory from '@/components/molecules/RollHistory';
import { rollService } from '@/services';

const HomePage = () => {
  const [gameState, setGameState] = useState({
    currentDice1: 1,
    currentDice2: 1,
    isRolling: false,
    history: []
  });
  const [loading, setLoading] = useState(true);

  // Load initial history
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const rolls = await rollService.getAll();
        setGameState(prev => ({
          ...prev,
          history: rolls
        }));
      } catch (error) {
        console.error('Failed to load history:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadHistory();
  }, []);

  const rollDice = async () => {
    if (gameState.isRolling) return;

    // Start rolling animation
    setGameState(prev => ({ ...prev, isRolling: true }));

    try {
      // Generate new roll
      const newRoll = rollService.generateRoll();
      
      // Simulate dice rolling time
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Update dice display
      setGameState(prev => ({
        ...prev,
        currentDice1: newRoll.dice1,
        currentDice2: newRoll.dice2,
        isRolling: false
      }));

      // Save to history
      const savedRoll = await rollService.create(newRoll);
      const updatedHistory = await rollService.getAll();
      
      setGameState(prev => ({
        ...prev,
        history: updatedHistory
      }));

      // Show success toast
      toast.success(`Rolled ${newRoll.total}!`, {
        icon: '🎲'
      });

    } catch (error) {
      setGameState(prev => ({ ...prev, isRolling: false }));
      toast.error('Failed to roll dice');
      console.error('Roll failed:', error);
    }
  };

  const clearHistory = async () => {
    try {
      await rollService.clearHistory();
      setGameState(prev => ({
        ...prev,
        history: []
      }));
      toast.success('History cleared!');
    } catch (error) {
      toast.error('Failed to clear history');
      console.error('Clear failed:', error);
    }
  };

  const currentTotal = gameState.currentDice1 + gameState.currentDice2;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-primary font-heading text-xl">Loading Lucky Dice...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-display text-4xl md:text-6xl text-primary mb-4 neon-glow">
            Lucky Dice 🎲
          </h1>
          <p className="text-white/80 font-heading text-lg md:text-xl">
            Roll the dice and test your luck!
          </p>
        </motion.div>

        {/* Main Game Area */}
        <div className="space-y-8">
          {/* Dice Display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <DiceDisplay
              dice1={gameState.currentDice1}
              dice2={gameState.currentDice2}
              isRolling={gameState.isRolling}
              total={currentTotal}
            />
          </motion.div>

          {/* Roll Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <Button
              variant="primary"
              size="xl"
              onClick={rollDice}
              disabled={gameState.isRolling}
              className="w-full md:w-auto min-w-[200px] animate-glow-pulse"
            >
              {gameState.isRolling ? (
                <span className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Rolling...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <span>🎲</span>
                  <span>ROLL DICE</span>
                  <span>🎲</span>
                </span>
              )}
            </Button>
          </motion.div>

          {/* History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <RollHistory
              rolls={gameState.history}
              onClear={clearHistory}
            />
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-12 text-white/50"
        >
          <p className="font-heading">May the odds be in your favor!</p>
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;