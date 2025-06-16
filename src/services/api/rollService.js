import { toast } from 'react-toastify';

class RollService {
  constructor() {
    this.players = [];
    this.currentPlayerIndex = 0;
    this.gameMode = 'single'; // 'single' or 'multi'
    this.gameActive = false;
    this.apperClient = null;
    this.initializeClient();
  }

  initializeClient() {
    const { ApperClient } = window.ApperSDK;
    this.apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
  }

  async getAll() {
    try {
      const params = {
        Fields: ['dice1', 'dice2', 'total', 'timestamp', 'player_id', 'player_name'],
        orderBy: [
          {
            FieldName: "timestamp",
            SortType: "DESC"
          }
        ],
        PagingInfo: {
          Limit: 10,
          Offset: 0
        }
      };

      const response = await this.apperClient.fetchRecords('roll', params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return [];
      }

      return response.data || [];
    } catch (error) {
      console.error("Error fetching rolls:", error);
      toast.error('Failed to load roll history');
      return [];
    }
  }

  async getById(id) {
    try {
      const params = {
        fields: ['dice1', 'dice2', 'total', 'timestamp', 'player_id', 'player_name']
      };

      const response = await this.apperClient.getRecordById('roll', parseInt(id, 10), params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return null;
      }

      return response.data;
    } catch (error) {
      console.error(`Error fetching roll with ID ${id}:`, error);
      toast.error('Failed to load roll');
      return null;
    }
  }

  async create(rollData) {
    try {
      const params = {
        records: [
          {
            // Only include Updateable fields
            dice1: rollData.dice1,
            dice2: rollData.dice2,
            total: rollData.total,
            timestamp: rollData.timestamp,
            player_id: rollData.playerId || null,
            player_name: rollData.playerName || null
          }
        ]
      };

      const response = await this.apperClient.createRecord('roll', params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return null;
      }

      if (response.results) {
        const successfulRecords = response.results.filter(result => result.success);
        const failedRecords = response.results.filter(result => !result.success);
        
        if (failedRecords.length > 0) {
          console.error(`Failed to create roll records:${JSON.stringify(failedRecords)}`);
          
          failedRecords.forEach(record => {
            record.errors?.forEach(error => {
              toast.error(`${error.fieldLabel}: ${error.message}`);
            });
            if (record.message) toast.error(record.message);
          });
        }
        
        return successfulRecords.length > 0 ? successfulRecords[0].data : null;
      }

      return null;
    } catch (error) {
      console.error("Error creating roll:", error);
      toast.error('Failed to save roll');
      return null;
    }
  }

  async delete(id) {
    try {
      const params = {
        RecordIds: [parseInt(id, 10)]
      };

      const response = await this.apperClient.deleteRecord('roll', params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return false;
      }

      if (response.results) {
        const failedDeletions = response.results.filter(result => !result.success);
        
        if (failedDeletions.length > 0) {
          console.error(`Failed to delete roll records:${JSON.stringify(failedDeletions)}`);
          
          failedDeletions.forEach(record => {
            if (record.message) toast.error(record.message);
          });
          return false;
        }
        
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error deleting roll:", error);
      toast.error('Failed to delete roll');
      return false;
    }
  }

  async clearHistory() {
    try {
      // Get all rolls first
      const rolls = await this.getAll();
      
      if (rolls.length === 0) {
        return true;
      }

      const rollIds = rolls.map(roll => roll.Id);
      const params = {
        RecordIds: rollIds
      };

      const response = await this.apperClient.deleteRecord('roll', params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error clearing history:", error);
      toast.error('Failed to clear history');
      return false;
    }
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

  // Multi-player methods (using in-memory storage for game session)
  async addPlayer(name) {
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
    const index = this.players.findIndex(p => p.Id === parseInt(id, 10));
    if (index === -1) {
      throw new Error('Player not found');
    }
    this.players.splice(index, 1);
    return true;
  }

  async getActivePlayers() {
    return this.players.filter(p => p.isActive && p.strikes < 3);
  }

  async getPlayerStats(id) {
    const player = this.players.find(p => p.Id === parseInt(id, 10));
    if (!player) {
      throw new Error('Player not found');
    }
    
    return {
      ...player,
      averageRoll: player.totalRolls > 0 ? (player.totalScore / player.totalRolls).toFixed(1) : 0
    };
  }

  async getCurrentPlayer() {
    const activePlayers = this.players.filter(p => p.isActive && p.strikes < 3);
    if (activePlayers.length === 0) return null;
    
    if (this.currentPlayerIndex >= activePlayers.length) {
      this.currentPlayerIndex = 0;
    }
    
    return activePlayers[this.currentPlayerIndex];
  }

  async nextTurn() {
    const activePlayers = this.players.filter(p => p.isActive && p.strikes < 3);
    if (activePlayers.length <= 1) {
      this.gameActive = false;
      return null;
    }
    
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % activePlayers.length;
    return this.getCurrentPlayer();
  }

  async setGameMode(mode) {
    this.gameMode = mode;
    if (mode === 'single') {
      this.players = [];
      this.currentPlayerIndex = 0;
      this.gameActive = false;
    }
    return true;
  }

  async startGame() {
    if (this.players.length < 2) {
      throw new Error('At least 2 players required to start the game');
    }
    this.gameActive = true;
    this.currentPlayerIndex = 0;
    this.gameMode = 'multi';
    return true;
  }

  async resetGame() {
    this.players = [];
    this.currentPlayerIndex = 0;
    this.gameActive = false;
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