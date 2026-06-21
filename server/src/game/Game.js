import {
  MAP_SIZE,
  MAX_FOOD,
  ALARM_COUNT,
  getSpeedByMass,
  getDistance,
  canEat,
  updatePosition,
  calculateSplit,
} from './Physics.js';
import { Player, PlayerNode, Food, AlarmClock } from './Entity.js';

export class Game {
  constructor() {
    this.players = new Map();
    this.food = [];
    this.alarms = [];
    this.ejectedMasses = [];

    this.foodIdCounter = 0;
    this.alarmIdCounter = 0;
    this.ejectedIdCounter = 0;
    this.nodeIdCounter = 0;

    // Game timer state
    this.roundDuration = 90; // 90 seconds per round
    this.timer = this.roundDuration;
    this.isIntermission = false;
    this.intermissionTimer = 10; // 10 seconds between rounds

    // Sunrise (shrink) ring state
    this.mapCenter = MAP_SIZE / 2;
    this.maxRingRadius = MAP_SIZE * 0.7; // Start wider than the square boundary
    this.ringRadius = this.maxRingRadius;

    this.initWorld();
  }

  initWorld() {
    this.food = [];
    this.alarms = [];
    this.ejectedMasses = [];

    // Spawn initial alarms
    for (let i = 0; i < ALARM_COUNT; i++) {
      this.alarms.push(new AlarmClock(this.alarmIdCounter++));
    }

    // Spawn initial food
    this.spawnFood(MAX_FOOD);
  }

  spawnFood(count) {
    for (let i = 0; i < count; i++) {
      this.food.push(new Food(this.foodIdCounter++));
    }
  }

  addPlayer(id, name, skin) {
    const player = new Player(id, name, skin);
    // Spawn player with a single starting node of mass 30
    const margin = 200;
    const rx = margin + Math.random() * (MAP_SIZE - margin * 2);
    const ry = margin + Math.random() * (MAP_SIZE - margin * 2);

    const node = new PlayerNode(this.nodeIdCounter++, id, rx, ry, 30);
    player.nodes.push(node);

    this.players.set(id, player);
    return player;
  }

  removePlayer(id) {
    this.players.delete(id);
  }

  handleInput(id, angle, speedFraction) {
    const player = this.players.get(id);
    if (!player || player.isDead) return;

    player.targetAngle = angle;
    player.targetSpeed = Math.min(1, Math.max(0, speedFraction));
  }

  handleSplit(id) {
    const player = this.players.get(id);
    if (!player || player.isDead || player.nodes.length >= 16) return;

    const angle = player.targetAngle !== undefined ? player.targetAngle : 0;
    const newNodes = [];

    for (const node of player.nodes) {
      if (node.mass >= 36 && player.nodes.length + newNodes.length < 16) {
        // Cut mass in half
        const halfMass = Math.floor(node.mass / 2);
        node.updateMass(halfMass);

        const splitData = calculateSplit(node.x, node.y, angle, node.radius);
        const newNode = new PlayerNode(
          this.nodeIdCounter++,
          id,
          splitData.x,
          splitData.y,
          halfMass
        );

        // Apply impulse
        newNode.vx = splitData.vx;
        newNode.vy = splitData.vy;

        // Set merge cooldown (e.g. 15 seconds + mass-based penalty)
        node.mergeTime = Date.now() + 15000 + halfMass * 50;
        newNode.mergeTime = Date.now() + 15000 + halfMass * 50;

        newNodes.push(newNode);
      }
    }

    if (newNodes.length > 0) {
      player.nodes.push(...newNodes);
      player.splitTriggered = true; // Event notification for sound
    }
  }

  handleEject(id) {
    const player = this.players.get(id);
    if (!player || player.isDead) return;

    const angle = player.targetAngle !== undefined ? player.targetAngle : 0;

    for (const node of player.nodes) {
      if (node.mass >= 30) {
        // Eject 13 mass, node loses 15 mass (conversion loss)
        node.updateMass(node.mass - 15);

        const spawnDist = node.radius + 15;
        const ex = node.x + Math.cos(angle) * spawnDist;
        const ey = node.y + Math.sin(angle) * spawnDist;

        this.ejectedMasses.push({
          id: this.ejectedIdCounter++,
          x: Math.max(10, Math.min(MAP_SIZE - 10, ex)),
          y: Math.max(10, Math.min(MAP_SIZE - 10, ey)),
          vx: Math.cos(angle) * 350,
          vy: Math.sin(angle) * 350,
          mass: 13,
          radius: 8,
        });

        player.ejectTriggered = true; // Event notification for sound
      }
    }
  }

  tick(dt) {
    if (this.isIntermission) {
      this.intermissionTimer -= dt;
      if (this.intermissionTimer <= 0) {
        this.resetGame();
      }
      return;
    }

    // Shrink round timer
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = 0;
      this.isIntermission = true;
      this.intermissionTimer = 10;
      return;
    }

    // Calculate ring radius based on remaining time
    const timeRatio = Math.max(0, this.timer / this.roundDuration);
    // Ring shrinks from maxRingRadius down to 250px
    this.ringRadius = 250 + (this.maxRingRadius - 250) * timeRatio;

    // 1. Update Player Node Physics
    this.players.forEach((player) => {
      if (player.isDead) return;

      const angle =
        player.targetAngle !== undefined ? player.targetAngle : null;
      const speedFrac =
        player.targetSpeed !== undefined ? player.targetSpeed : 0;

      for (let i = 0; i < player.nodes.length; i++) {
        const node = player.nodes[i];

        // Decelerate splitting/ejected impulse velocities
        node.vx *= 0.9;
        node.vy *= 0.9;
        if (Math.abs(node.vx) < 1) node.vx = 0;
        if (Math.abs(node.vy) < 1) node.vy = 0;

        // Base velocity directed by client pointer input
        let dx = 0;
        let dy = 0;
        if (angle !== null) {
          dx = Math.cos(angle) * speedFrac;
          dy = Math.sin(angle) * speedFrac;
        }

        // Combine inputs + split physics velocities
        const speed = getSpeedByMass(node.mass);

        // Update coordinates
        const stepX = dx * speed + node.vx;
        const stepY = dy * speed + node.vy;

        // Perform move and clamp to map
        const newPos = updatePosition(
          node.x,
          node.y,
          stepX,
          stepY,
          1,
          dt,
          node.radius
        );
        node.x = newPos.x;
        node.y = newPos.y;

        // Mass decay (natural metabolic decay)
        if (node.mass > 100) {
          node.updateMass(node.mass - node.mass * 0.002 * dt);
        }

        // Sunrise Zone mass penalty (if outside the ring)
        const distFromCenter = getDistance(
          node.x,
          node.y,
          this.mapCenter,
          this.mapCenter
        );
        if (distFromCenter > this.ringRadius) {
          // Burn outside the shadow! Lose 2.5% of mass per second
          const loss = node.mass * 0.025 * dt;
          node.updateMass(Math.max(10, node.mass - loss));
        }
      }

      // Check self-merging of nodes
      this.handleSelfMerge(player);

      player.updateScore();
    });

    // 2. Update Ejected Masses Physics (they slide and stop)
    this.ejectedMasses.forEach((pellet) => {
      pellet.vx *= 0.92;
      pellet.vy *= 0.92;
      pellet.x = Math.max(
        pellet.radius,
        Math.min(MAP_SIZE - pellet.radius, pellet.x + pellet.vx * dt)
      );
      pellet.y = Math.max(
        pellet.radius,
        Math.min(MAP_SIZE - pellet.radius, pellet.y + pellet.vy * dt)
      );
    });

    // 3. Collisions & Interactions
    this.handleCollisions();

    // 4. Respawn food
    if (this.food.length < MAX_FOOD) {
      this.spawnFood(MAX_FOOD - this.food.length);
    }
  }

  handleSelfMerge(player) {
    const nodes = player.nodes;
    if (nodes.length <= 1) return;

    const now = Date.now();
    for (let i = 0; i < nodes.length; i++) {
      const nodeA = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeB = nodes[j];

        // Check if both nodes' merge cooldowns have expired
        if (now > (nodeA.mergeTime || 0) && now > (nodeB.mergeTime || 0)) {
          const dist = getDistance(nodeA.x, nodeA.y, nodeB.x, nodeB.y);
          // Nodes overlap significantly, we merge them
          if (dist < (nodeA.radius + nodeB.radius) * 0.5) {
            nodeA.updateMass(nodeA.mass + nodeB.mass);
            nodes.splice(j, 1);
            j--;
          }
        }
      }
    }
  }

  handleCollisions() {
    // Collect all active player nodes
    const activeNodes = [];
    this.players.forEach((player) => {
      if (player.isDead) return;
      player.nodes.forEach((node) => {
        activeNodes.push({ player, node });
      });
    });

    // Sort nodes descending by mass (bigger first, optimizes eating order)
    activeNodes.sort((a, b) => b.node.mass - a.node.mass);

    // Node vs Food
    for (let i = 0; i < activeNodes.length; i++) {
      const { player, node } = activeNodes[i];

      this.food = this.food.filter((f) => {
        const dist = getDistance(node.x, node.y, f.x, f.y);
        if (dist < node.radius) {
          node.updateMass(node.mass + f.mass);
          player.eatTriggered = true; // Play eat sound
          return false; // remove food
        }
        return true;
      });
    }

    // Node vs EjectedMass
    for (let i = 0; i < activeNodes.length; i++) {
      const { player, node } = activeNodes[i];

      this.ejectedMasses = this.ejectedMasses.filter((pellet) => {
        const dist = getDistance(node.x, node.y, pellet.x, pellet.y);
        // Eject can only be eaten by nodes bigger than it
        if (node.mass > pellet.mass * 1.1 && dist < node.radius) {
          node.updateMass(node.mass + pellet.mass);
          player.eatTriggered = true;
          return false; // remove pellet
        }
        return true;
      });
    }

    // Node vs Alarm Clock (Spiked virus)
    for (let i = 0; i < activeNodes.length; i++) {
      const { player, node } = activeNodes[i];

      for (let k = 0; k < this.alarms.length; k++) {
        const alarm = this.alarms[k];
        // If node is larger than alarm and collides
        if (
          node.mass > alarm.mass &&
          getDistance(node.x, node.y, alarm.x, alarm.y) < node.radius + 10
        ) {
          // Explode the player!
          this.explodeNode(player, node);
          player.alarmExploded = true; // Event notification for sound

          // Respawn alarm elsewhere
          this.alarms[k] = new AlarmClock(alarm.id);
          break;
        }
      }
    }

    // Node vs Node (Different players, eating mechanic)
    for (let i = 0; i < activeNodes.length; i++) {
      const pA = activeNodes[i].player;
      const nA = activeNodes[i].node;

      for (let j = 0; j < activeNodes.length; j++) {
        if (i === j) continue;
        const pB = activeNodes[j].player;
        const nB = activeNodes[j].node;

        if (pA.id === pB.id) continue; // Same player handled separately
        if (pA.isDead || pB.isDead) continue;

        if (
          canEat(nA.mass, nA.radius, nA.x, nA.y, nB.mass, nB.radius, nB.x, nB.y)
        ) {
          // A eats B!
          nA.updateMass(nA.mass + nB.mass);
          pA.eatPlayerTriggered = true; // meme sound cue

          // Remove node B
          const nodeIdx = pB.nodes.indexOf(nB);
          if (nodeIdx > -1) {
            pB.nodes.splice(nodeIdx, 1);
          }

          // If B has no nodes left, B is dead
          if (pB.nodes.length === 0) {
            pB.isDead = true;
          }

          // Re-sort node references since masses updated
          activeNodes.splice(j, 1);
          if (j < i) i--; // adjust index if deleted node was before i
          j--;
        }
      }
    }
  }

  explodeNode(player, node) {
    if (player.nodes.length >= 16) return;

    // Explode player into smaller pieces
    const maxPieces = Math.min(10, 16 - player.nodes.length);
    if (maxPieces <= 0) return;

    const originalMass = node.mass;
    const piecesCount = Math.floor(Math.min(maxPieces, originalMass / 15));
    if (piecesCount <= 1) return;

    const pieceMass = Math.floor(originalMass / (piecesCount + 1));
    node.updateMass(pieceMass);

    for (let i = 0; i < piecesCount; i++) {
      const angle = (i / piecesCount) * Math.PI * 2;
      const splitData = calculateSplit(node.x, node.y, angle, node.radius);

      const newNode = new PlayerNode(
        this.nodeIdCounter++,
        player.id,
        splitData.x,
        splitData.y,
        pieceMass
      );
      newNode.vx = Math.cos(angle) * 320;
      newNode.vy = Math.sin(angle) * 320;
      newNode.mergeTime = Date.now() + 20000; // longer cooldown for explosions

      player.nodes.push(newNode);
    }
  }

  resetGame() {
    this.timer = this.roundDuration;
    this.isIntermission = false;
    this.ringRadius = this.maxRingRadius;

    // Revive all dead players and reset their scores/nodes
    this.players.forEach((player) => {
      player.isDead = false;
      player.score = 0;
      player.nodes = [];

      const margin = 200;
      const rx = margin + Math.random() * (MAP_SIZE - margin * 2);
      const ry = margin + Math.random() * (MAP_SIZE - margin * 2);

      const node = new PlayerNode(this.nodeIdCounter++, player.id, rx, ry, 30);
      player.nodes.push(node);
    });

    this.initWorld();
  }

  getLeaderboard() {
    return Array.from(this.players.values())
      .map((p) => ({
        id: p.id,
        name: p.name,
        mass: Math.floor(p.getCombinedMass()),
        score: p.score,
        skin: p.skin,
        isDead: p.isDead,
      }))
      .sort((a, b) => b.mass - a.mass)
      .slice(0, 10);
  }

  getState() {
    const playersList = [];
    this.players.forEach((player) => {
      if (player.isDead) return;
      playersList.push({
        id: player.id,
        name: player.name,
        color: player.color,
        skin: player.skin,
        nodes: player.nodes.map((n) => ({
          id: n.id,
          x: Math.round(n.x),
          y: Math.round(n.y),
          mass: Math.round(n.mass),
          radius: Math.round(n.radius),
        })),
      });
    });

    // Check for triggered events to send audio cues, then clear flags
    const audioEvents = [];
    this.players.forEach((player) => {
      if (player.eatTriggered) {
        audioEvents.push({ playerId: player.id, type: 'eat' });
        player.eatTriggered = false;
      }
      if (player.splitTriggered) {
        audioEvents.push({ playerId: player.id, type: 'split' });
        player.splitTriggered = false;
      }
      if (player.ejectTriggered) {
        audioEvents.push({ playerId: player.id, type: 'eject' });
        player.ejectTriggered = false;
      }
      if (player.alarmExploded) {
        audioEvents.push({ playerId: player.id, type: 'explode' });
        player.alarmExploded = false;
      }
      if (player.eatPlayerTriggered) {
        audioEvents.push({ playerId: player.id, type: 'eat_player' });
        player.eatPlayerTriggered = false;
      }
    });

    return {
      players: playersList,
      food: this.food.map((f) => ({
        id: f.id,
        x: Math.round(f.x),
        y: Math.round(f.y),
        type: f.type,
        color: f.color,
      })),
      alarms: this.alarms.map((a) => ({
        id: a.id,
        x: Math.round(a.x),
        y: Math.round(a.y),
        radius: Math.round(a.radius),
      })),
      ejected: this.ejectedMasses.map((e) => ({
        id: e.id,
        x: Math.round(e.x),
        y: Math.round(e.y),
        radius: Math.round(e.radius),
      })),
      timer: Math.ceil(this.timer),
      isIntermission: this.isIntermission,
      intermissionTimer: Math.ceil(this.intermissionTimer),
      ringRadius: Math.round(this.ringRadius),
      audioEvents,
    };
  }
}
