import rollData from '../mockData/roll.json';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class RollService {
  constructor() {
    this.rolls = [...rollData];
    this.players = [];
    this.currentPlayerIndex = 0;
    this.gameMode = 'single'; // 'single' or 'multi'
    this.gameActive = false;
  }

  async getAll() {
    await delay(200);
    return [...this.rolls];
  }

  async getById(id) {
    await delay(200);
    const roll = this.rolls.find(r => r.Id === parseInt(id, 10));
    if (!roll) {
      throw new Error('Roll not found');
    }
    return { ...roll };
  }

  async create(rollData) {
    await delay(300);
    const newRoll = {
      Id: Math.max(...this.rolls.map(r => r.Id), 0) + 1,
      ...rollData,
      timestamp: new Date().toISOString()
    };
    this.rolls.unshift(newRoll);
    
    // Update player stats if in multi-player mode
    if (this.gameMode === 'multi' && rollData.playerId) {
      const player = this.players.find(p => p.Id === rollData.playerId);
      if (player) {
        player.totalRolls++;
        player.totalScore += rollData.total;
        
        // Check for strikes (rolling 2 or 12)
        if (rollData.total === 2 || rollData.total === 12) {
          player.strikes++;
        }
        
        // Track highest roll
        if (rollData.total > player.highestRoll) {
          player.highestRoll = rollData.total;
        }
      }
    }
    
    // Keep only last 10 rolls for multi-player, 5 for single
    const maxRolls = this.gameMode === 'multi' ? 10 : 5;
    if (this.rolls.length > maxRolls) {
      this.rolls = this.rolls.slice(0, maxRolls);
    }
    return { ...newRoll };
  }

  async delete(id) {
    await delay(200);
    const index = this.rolls.findIndex(r => r.Id === parseInt(id, 10));
    if (index === -1) {
      throw new Error('Roll not found');
    }
    this.rolls.splice(index, 1);
    return true;
  }

  async clearHistory() {
    await delay(200);
    this.rolls = [];
    return true;
  }

  generateRoll() {
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const total = dice1 + dice2;
    
    return {
      dice1,
      dice2,
      total,
      timestamp: new Date().toISOString()
    };
  }

  // Multi-player methods
  async addPlayer(name) {
    await delay(200);
    if (!name || name.trim().length === 0) {
      throw new Error('Player name is required');
    }
    
    if (this.players.find(p => p.name.toLowerCase() === name.toLowerCase().trim())) {
      throw new Error('Player name already exists');
    }
    
    const newPlayer = {
      Id: Math.max(...this.players.map(p => p.Id), 0) + 1,
      name: name.trim(),
      totalRolls: 0,
      totalScore: 0,
      strikes: 0,
      highestRoll: 0,
      isActive: true,
      joinedAt: new Date().toISOString()
    };
    
    this.players.push(newPlayer);
    return { ...newPlayer };
  }

  async removePlayer(id) {
    await delay(200);
    const index = this.players.findIndex(p => p.Id === parseInt(id, 10));
    if (index === -1) {
      throw new Error('Player not found');
    }
    this.players.splice(index, 1);
    return true;
  }

  async getActivePlayers() {
    await delay(200);
    return this.players.filter(p => p.isActive && p.strikes < 3);
  }

  async getPlayerStats(id) {
    await delay(200);
    const player = this.players.find(p => p.Id === parseInt(id, 10));
    if (!player) {
      throw new Error('Player not found');
    }
    
    const playerRolls = this.rolls.filter(r => r.playerId === id);
    return {
      ...player,
      averageRoll: player.totalRolls > 0 ? (player.totalScore / player.totalRolls).toFixed(1) : 0,
      recentRolls: playerRolls.slice(0, 3)
    };
  }

  async getCurrentPlayer() {
    await delay(100);
    const activePlayers = this.players.filter(p => p.isActive && p.strikes < 3);
    if (activePlayers.length === 0) return null;
    
    if (this.currentPlayerIndex >= activePlayers.length) {
      this.currentPlayerIndex = 0;
    }
    
    return activePlayers[this.currentPlayerIndex];
  }

  async nextTurn() {
    await delay(100);
    const activePlayers = this.players.filter(p => p.isActive && p.strikes < 3);
    if (activePlayers.length <= 1) {
      this.gameActive = false;
      return null;
    }
    
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % activePlayers.length;
    return this.getCurrentPlayer();
  }

  async setGameMode(mode) {
    await delay(100);
    this.gameMode = mode;
    if (mode === 'single') {
      this.players = [];
      this.currentPlayerIndex = 0;
      this.gameActive = false;
    }
    return true;
  }

  async startGame() {
    await delay(200);
    if (this.players.length < 2) {
      throw new Error('At least 2 players required to start the game');
    }
    this.gameActive = true;
    this.currentPlayerIndex = 0;
    this.gameMode = 'multi';
    return true;
  }

  async resetGame() {
    await delay(200);
    this.players = [];
    this.currentPlayerIndex = 0;
    this.gameActive = false;
    this.rolls = [];
    this.gameMode = 'single';
    return true;
  }

  getGameState() {
    return {
      players: [...this.players],
      currentPlayerIndex: this.currentPlayerIndex,
      gameMode: this.gameMode,
      gameActive: this.gameActive,
      activePlayers: this.players.filter(p => p.isActive && p.strikes < 3).length
    };
  }
}

export default new RollService();