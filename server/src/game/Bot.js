import { getDistance } from './Physics.js';

const BOT_NAMES = ['Asep 🤖', 'Budi 🤖', 'Joko 🤖', 'Siti 🤖', 'Ratna 🤖', 'Agus 🤖', 'Indra 🤖', 'Dewi 🤖'];
const BOT_SKINS = ['gigachad', 'doge', 'pepe'];

export class BotController {
  constructor(game, id) {
    this.id = id;
    const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    const skin = BOT_SKINS[Math.floor(Math.random() * BOT_SKINS.length)];
    
    // Add bot to game as a normal player
    this.player = game.addPlayer(this.id, name, skin);
    this.player.isBot = true;

    // AI State
    this.targetFood = null;
    this.decisionTimer = 0;
  }

  update(game, dt) {
    if (this.player.isDead) return;

    this.decisionTimer -= dt;

    const botCenter = this.getCenter();
    if (!botCenter) return;

    const combinedMass = this.player.getCombinedMass();

    // 1. Check for immediate threats (Sleepers or much larger players)
    const threat = this.findThreat(game, botCenter, combinedMass);
    if (threat) {
      // Flee in opposite direction
      const angle = Math.atan2(botCenter.y - threat.y, botCenter.x - threat.x);
      game.handleInput(this.id, angle, 1.0);
      return;
    }

    // 2. Check for prey (smaller players)
    const prey = this.findPrey(game, botCenter, combinedMass);
    if (prey) {
      // Chase prey
      const angle = Math.atan2(prey.y - botCenter.y, prey.x - botCenter.x);
      game.handleInput(this.id, angle, 1.0);
      return;
    }

    // 3. Re-evaluate food target every 0.5s or if target is eaten
    if (this.decisionTimer <= 0 || !this.targetFood || !game.food.includes(this.targetFood)) {
      this.targetFood = this.findNearestFood(game, botCenter);
      this.decisionTimer = 0.5;
    }

    // Move towards food
    if (this.targetFood) {
      const angle = Math.atan2(this.targetFood.y - botCenter.y, this.targetFood.x - botCenter.x);
      game.handleInput(this.id, angle, 1.0);
    } else {
      // Random wandering if no food
      if (this.decisionTimer <= 0) {
        game.handleInput(this.id, Math.random() * Math.PI * 2, 1.0);
        this.decisionTimer = 1.0;
      }
    }
  }

  getCenter() {
    if (this.player.nodes.length === 0) return null;
    let x = 0, y = 0;
    for (const node of this.player.nodes) {
      x += node.x;
      y += node.y;
    }
    return { x: x / this.player.nodes.length, y: y / this.player.nodes.length };
  }

  findThreat(game, botCenter, botMass) {
    // Check Sleepers
    for (const alarm of game.alarms) {
      if (botMass > alarm.mass * 0.9) {
        const dist = getDistance(botCenter.x, botCenter.y, alarm.x, alarm.y);
        if (dist < 300) return alarm; // Danger close
      }
    }

    // Check Players
    let closestThreat = null;
    let minDist = 400; // Awareness radius
    
    game.players.forEach((p) => {
      if (p.id === this.id || p.isDead) return;
      // We only consider the largest node of the threat for simplicity
      let maxNodeMass = 0;
      let threatNode = null;
      for (const n of p.nodes) {
        if (n.mass > maxNodeMass) {
          maxNodeMass = n.mass;
          threatNode = n;
        }
      }

      if (threatNode && maxNodeMass > botMass * 1.1) {
        const dist = getDistance(botCenter.x, botCenter.y, threatNode.x, threatNode.y);
        if (dist < minDist) {
          minDist = dist;
          closestThreat = threatNode;
        }
      }
    });

    return closestThreat;
  }

  findPrey(game, botCenter, botMass) {
    let closestPrey = null;
    let minDist = 300; // Hunting radius

    game.players.forEach((p) => {
      if (p.id === this.id || p.isDead) return;
      
      let minNodeMass = Infinity;
      let preyNode = null;
      for (const n of p.nodes) {
        if (n.mass < minNodeMass) {
          minNodeMass = n.mass;
          preyNode = n;
        }
      }

      if (preyNode && botMass > minNodeMass * 1.25) { // Needs to be 25% bigger to eat
        const dist = getDistance(botCenter.x, botCenter.y, preyNode.x, preyNode.y);
        if (dist < minDist) {
          minDist = dist;
          closestPrey = preyNode;
        }
      }
    });

    return closestPrey;
  }

  findNearestFood(game, botCenter) {
    let nearest = null;
    let minDist = Infinity;
    
    for (const f of game.food) {
      const dist = getDistance(botCenter.x, botCenter.y, f.x, f.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = f;
      }
    }
    
    return nearest;
  }
}
