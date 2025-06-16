import rollData from '../mockData/roll.json';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class RollService {
  constructor() {
    this.rolls = [...rollData];
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
    // Keep only last 5 rolls
    if (this.rolls.length > 5) {
      this.rolls = this.rolls.slice(0, 5);
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
}

export default new RollService();