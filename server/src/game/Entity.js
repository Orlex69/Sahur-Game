import { massToRadius, MAP_SIZE } from './Physics.js';

// Predefined neon colors
const NEON_COLORS = [
  '#ff0055', // Neon Pink
  '#00ffcc', // Neon Cyan
  '#39ff14', // Neon Green
  '#ff9900', // Neon Orange
  '#ff00ff', // Neon Magenta
  '#ffff00', // Neon Yellow
];

// Predefined brainrot food names
const BRAINROT_FOODS = ['date', 'water', 'milk', 'kebab', 'shake'];

export class Food {
  constructor(id, x, y) {
    this.id = id;
    this.x = x || Math.random() * MAP_SIZE;
    this.y = y || Math.random() * MAP_SIZE;
    this.mass = 5 + Math.floor(Math.random() * 8); // mass between 5 and 12
    this.type =
      BRAINROT_FOODS[Math.floor(Math.random() * BRAINROT_FOODS.length)];
    this.color = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
  }
}

export class AlarmClock {
  constructor(id, x, y) {
    this.id = id;
    this.x = x || Math.random() * (MAP_SIZE - 200) + 100;
    this.y = y || Math.random() * (MAP_SIZE - 200) + 100;
    this.mass = 120; // Hard static mass
    this.radius = massToRadius(this.mass);
  }
}

export class PlayerNode {
  constructor(id, playerId, x, y, mass) {
    this.id = id;
    this.playerId = playerId;
    this.x = x;
    this.y = y;
    this.mass = mass;
    this.radius = massToRadius(mass);
    this.vx = 0; // split physics X velocity
    this.vy = 0; // split physics Y velocity
  }

  updateMass(newMass) {
    this.mass = newMass;
    this.radius = massToRadius(this.mass);
  }
}

export class Player {
  constructor(id, name, skin) {
    this.id = id;
    this.name = name.slice(0, 15).trim() || 'Noob Sigma';
    this.skin = skin || 'gigachad';
    this.color = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
    this.nodes = [];
    this.score = 0;
    this.isDead = false;
  }

  getCombinedMass() {
    return this.nodes.reduce((sum, node) => sum + node.mass, 0);
  }

  updateScore() {
    const currentMass = this.getCombinedMass();
    if (currentMass > this.score) {
      this.score = Math.floor(currentMass);
    }
  }
}
