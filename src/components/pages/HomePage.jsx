import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { Howl } from 'howler';
import Button from '@/components/atoms/Button';
import DiceDisplay from '@/components/molecules/DiceDisplay';
import RollHistory from '@/components/molecules/RollHistory';
import ApperIcon from '@/components/ApperIcon';
import { rollService } from '@/services';
const HomePage = () => {
  const [gameState, setGameState] = useState({
    mode: 'select', // 'select', 'setup', 'playing', 'finished'
    gameMode: 'single', // 'single' or 'multi'
    currentDice1: 1,
    currentDice2: 1,
    isRolling: false,
    history: [],
    players: [],
    currentPlayer: null,
    winner: null
  });
  const [loading, setLoading] = useState(true);
  const [newPlayerName, setNewPlayerName] = useState('');
  const diceRollSound = useRef(null);

  // Load initial history and initialize sound
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
    
    // Initialize dice roll sound
    diceRollSound.current = new Howl({
      src: ['/sounds/dice-roll.mp3', '/sounds/dice-roll.wav'],
      volume: 0.7,
      preload: true,
      onloaderror: (id, error) => {
        console.warn('Dice roll sound failed to load:', error);
      }
    });
    
    loadHistory();

    // Cleanup sound on unmount
    return () => {
      if (diceRollSound.current) {
        diceRollSound.current.unload();
      }
    };
  }, []);

  const startSinglePlayer = async () => {
    try {
      await rollService.setGameMode('single');
      setGameState(prev => ({
        ...prev,
        mode: 'playing',
        gameMode: 'single'
      }));
    } catch (error) {
      toast.error('Failed to start single player mode');
    }
  };

  const startMultiPlayerSetup = () => {
    setGameState(prev => ({
      ...prev,
      mode: 'setup',
      gameMode: 'multi',
      players: []
    }));
  };

  const addPlayer = async () => {
    if (!newPlayerName.trim()) {
      toast.error('Please enter a player name');
      return;
    }

    try {
      const player = await rollService.addPlayer(newPlayerName.trim());
      setGameState(prev => ({
        ...prev,
        players: [...prev.players, player]
      }));
      setNewPlayerName('');
      toast.success(`${player.name} joined the game!`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const removePlayer = async (playerId) => {
    try {
      await rollService.removePlayer(playerId);
      setGameState(prev => ({
        ...prev,
        players: prev.players.filter(p => p.Id !== playerId)
      }));
      toast.success('Player removed');
    } catch (error) {
      toast.error('Failed to remove player');
    }
  };

  const startMultiPlayerGame = async () => {
    try {
      await rollService.startGame();
      const currentPlayer = await rollService.getCurrentPlayer();
      setGameState(prev => ({
        ...prev,
        mode: 'playing',
        currentPlayer
      }));
      toast.success('Game started! 🎲');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const rollDice = async () => {
    if (gameState.isRolling) return;

    // Play dice roll sound effect
    try {
      if (diceRollSound.current && diceRollSound.current.state() === 'loaded') {
        diceRollSound.current.play();
      }
    } catch (error) {
      console.warn('Failed to play dice roll sound:', error);
    }

    // Start rolling animation
    setGameState(prev => ({ ...prev, isRolling: true }));

    try {
      // Generate new roll
      const newRoll = rollService.generateRoll();
      
      // Add player context for multi-player
      if (gameState.gameMode === 'multi' && gameState.currentPlayer) {
        newRoll.playerId = gameState.currentPlayer.Id;
        newRoll.playerName = gameState.currentPlayer.name;
      }
      
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
      
      // Update game state with new history
      setGameState(prev => ({
        ...prev,
        history: updatedHistory
      }));

      // Handle multi-player turn logic
      if (gameState.gameMode === 'multi') {
        const updatedPlayers = [...gameState.players];
        const currentPlayerIndex = updatedPlayers.findIndex(p => p.Id === gameState.currentPlayer.Id);
        
        if (currentPlayerIndex !== -1) {
          // Update player stats locally
          updatedPlayers[currentPlayerIndex] = {
            ...updatedPlayers[currentPlayerIndex],
            totalRolls: updatedPlayers[currentPlayerIndex].totalRolls + 1,
            totalScore: updatedPlayers[currentPlayerIndex].totalScore + newRoll.total,
            strikes: newRoll.total === 2 || newRoll.total === 12 
              ? updatedPlayers[currentPlayerIndex].strikes + 1 
              : updatedPlayers[currentPlayerIndex].strikes,
            highestRoll: Math.max(updatedPlayers[currentPlayerIndex].highestRoll, newRoll.total)
          };
        }

        // Check for strikes
        if (newRoll.total === 2 || newRoll.total === 12) {
          toast.warning(`${gameState.currentPlayer.name} got a strike! ⚠️`, {
            icon: '⚠️'
          });
          
          // Check if player is eliminated
          if (updatedPlayers[currentPlayerIndex].strikes >= 3) {
            toast.error(`${gameState.currentPlayer.name} is eliminated! 💀`);
            updatedPlayers[currentPlayerIndex].isActive = false;
          }
        } else {
          toast.success(`${gameState.currentPlayer.name} rolled ${newRoll.total}!`, {
            icon: '🎲'
          });
        }

        // Check for winner
        const activePlayers = updatedPlayers.filter(p => p.isActive && p.strikes < 3);
        if (activePlayers.length <= 1) {
          const winner = activePlayers[0];
          setGameState(prev => ({
            ...prev,
            mode: 'finished',
            winner,
            players: updatedPlayers
          }));
          
          if (winner) {
            toast.success(`🎉 ${winner.name} wins the game! 🏆`);
          } else {
            toast.info('Game ended - no players remaining!');
          }
          return;
        }

        // Move to next player
        const nextPlayer = await rollService.nextTurn();
        setGameState(prev => ({
          ...prev,
          currentPlayer: nextPlayer,
          players: updatedPlayers
        }));
        
        if (nextPlayer) {
          toast.info(`${nextPlayer.name}'s turn!`);
        }
      } else {
        // Single player mode
        toast.success(`Rolled ${newRoll.total}!`, {
          icon: '🎲'
        });
      }

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

  const resetGame = async () => {
    try {
      await rollService.resetGame();
      setGameState({
        mode: 'select',
        gameMode: 'single',
        currentDice1: 1,
        currentDice2: 1,
        isRolling: false,
        history: [],
        players: [],
        currentPlayer: null,
        winner: null
      });
      setNewPlayerName('');
      toast.success('Game reset!');
    } catch (error) {
      toast.error('Failed to reset game');
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

  // Mode Selection Screen
  if (gameState.mode === 'select') {
    return (
      <div className="min-h-screen bg-background overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="font-display text-4xl md:text-6xl text-primary mb-4 neon-glow">
              Lucky Dice 🎲
            </h1>
            <p className="text-white/80 font-heading text-lg md:text-xl">
              Choose your game mode
            </p>
          </motion.div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                variant="primary"
                size="xl"
                onClick={startSinglePlayer}
                className="w-full"
              >
                <span className="flex items-center justify-center space-x-3">
                  <span>🎲</span>
                  <span>Single Player</span>
                </span>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                variant="accent"
                size="xl"
                onClick={startMultiPlayerSetup}
                className="w-full"
              >
                <span className="flex items-center justify-center space-x-3">
                  <span>👥</span>
                  <span>Multi-Player</span>
                </span>
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // Multi-Player Setup Screen
  if (gameState.mode === 'setup') {
    return (
      <div className="min-h-screen bg-background overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="font-display text-3xl md:text-4xl text-primary mb-4">
              Multi-Player Setup
            </h1>
            <p className="text-white/80 font-heading">
              Add players to start the game (2-6 players)
            </p>
          </motion.div>

          {/* Add Player Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface/30 backdrop-blur-sm rounded-2xl p-6 border border-primary/20 mb-6"
          >
            <div className="flex space-x-3">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
                placeholder="Enter player name..."
                className="flex-1 px-4 py-3 bg-background/50 border border-secondary/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-primary/50"
                maxLength={20}
              />
              <Button
                variant="primary"
                onClick={addPlayer}
                disabled={!newPlayerName.trim() || gameState.players.length >= 6}
              >
                Add Player
              </Button>
            </div>
          </motion.div>

          {/* Players List */}
          {gameState.players.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface/30 backdrop-blur-sm rounded-2xl p-6 border border-primary/20 mb-6"
            >
              <h3 className="text-primary font-display text-xl mb-4">Players ({gameState.players.length})</h3>
              <div className="space-y-3">
                {gameState.players.map((player, index) => (
                  <motion.div
                    key={player.Id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between bg-background/50 rounded-lg p-3 border border-secondary/20"
                  >
                    <span className="text-white font-heading">{player.name}</span>
                    <button
                      onClick={() => removePlayer(player.Id)}
                      className="text-error hover:text-error/80 transition-colors p-1"
                    >
                      <ApperIcon name="X" className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Control Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={resetGame}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              variant="primary"
              onClick={startMultiPlayerGame}
              disabled={gameState.players.length < 2}
              className="flex-1"
            >
              Start Game ({gameState.players.length}/6)
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Game Finished Screen
  if (gameState.mode === 'finished') {
    return (
      <div className="min-h-screen bg-background overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-8"
          >
            <h1 className="font-display text-4xl md:text-5xl text-primary mb-4 neon-glow">
              🏆 Game Over! 🏆
            </h1>
            {gameState.winner ? (
              <div>
                <p className="text-accent font-display text-2xl mb-2">
                  {gameState.winner.name} Wins!
                </p>
                <p className="text-white/80 font-heading">
                  Congratulations on your victory!
                </p>
              </div>
            ) : (
              <p className="text-white/80 font-heading text-xl">
                No players remaining!
              </p>
            )}
          </motion.div>

          {/* Final Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface/30 backdrop-blur-sm rounded-2xl p-6 border border-primary/20 mb-6"
          >
            <h3 className="text-primary font-display text-xl mb-4">Final Stats</h3>
            <div className="space-y-3">
              {gameState.players.map((player) => (
                <div
                  key={player.Id}
                  className={`bg-background/50 rounded-lg p-4 border ${
                    player.Id === gameState.winner?.Id 
                      ? 'border-accent/50 bg-accent/10' 
                      : 'border-secondary/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-heading text-white">
                      {player.name}
                      {player.Id === gameState.winner?.Id && ' 👑'}
                    </span>
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      player.isActive && player.strikes < 3
                        ? 'bg-success/20 text-success'
                        : 'bg-error/20 text-error'
                    }`}>
                      {player.isActive && player.strikes < 3 ? 'Survivor' : 'Eliminated'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm text-white/70">
                    <div>
                      <span className="block">Rolls: {player.totalRolls}</span>
                    </div>
                    <div>
                      <span className="block">Strikes: {player.strikes}/3</span>
                    </div>
                    <div>
                      <span className="block">Best: {player.highestRoll}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="flex space-x-3">
            <Button
              variant="primary"
              onClick={resetGame}
              className="flex-1"
            >
              Play Again
            </Button>
          </div>

          {/* History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <RollHistory
              rolls={gameState.history}
              onClear={clearHistory}
              players={gameState.players}
              gameMode={gameState.gameMode}
            />
          </motion.div>
        </div>
      </div>
    );
  }

  // Playing Screen (both single and multi-player)
  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="font-display text-4xl md:text-6xl text-primary mb-4 neon-glow">
            Lucky Dice 🎲
          </h1>
          <p className="text-white/80 font-heading text-lg md:text-xl">
            {gameState.gameMode === 'multi' 
              ? `${gameState.currentPlayer?.name}'s Turn` 
              : 'Roll the dice and test your luck!'}
          </p>
        </motion.div>

        {/* Multi-Player Info */}
        {gameState.gameMode === 'multi' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface/30 backdrop-blur-sm rounded-2xl p-4 border border-primary/20 mb-6"
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {gameState.players.filter(p => p.isActive && p.strikes < 3).map((player) => (
                <div
                  key={player.Id}
                  className={`p-3 rounded-lg border text-center ${
                    player.Id === gameState.currentPlayer?.Id
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-secondary/20 bg-background/30 text-white/70'
                  }`}
                >
                  <div className="font-heading text-sm truncate">{player.name}</div>
                  <div className="text-xs mt-1">
                    Strikes: {player.strikes}/3
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

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
            className="text-center space-y-4"
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
            
            {gameState.gameMode === 'multi' && (
              <Button
                variant="outline"
                onClick={resetGame}
                className="ml-4"
              >
                End Game
              </Button>
            )}
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
              players={gameState.players}
              gameMode={gameState.gameMode}
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
          <p className="font-heading">
            {gameState.gameMode === 'multi' 
              ? 'Avoid rolling 2 or 12 - three strikes and you\'re out!' 
              : 'May the odds be in your favor!'}
          </p>
</motion.div>
      </div>
    </div>
  );
};

export default HomePage;