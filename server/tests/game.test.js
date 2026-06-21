import test from 'node:test';
import assert from 'node:assert';
import {
  massToRadius,
  getSpeedByMass,
  canEat,
  clamp,
} from '../src/game/Physics.js';
import { Game } from '../src/game/Game.js';

test('Physics - massToRadius calculations', () => {
  const radiusFor30 = massToRadius(30);
  const radiusFor100 = massToRadius(100);
  assert.ok(radiusFor100 > radiusFor30, 'Larger mass must equal larger radius');
});

test('Physics - getSpeedByMass scaling', () => {
  const speedFor10 = getSpeedByMass(10);
  const speedFor100 = getSpeedByMass(100);
  assert.ok(
    speedFor10 > speedFor100,
    'Smaller players must move faster than larger players'
  );
});

test('Physics - canEat collision calculations', () => {
  // A can eat B: A mass 100, radius 43, B mass 20, radius 23.
  const aMass = 100;
  const aRadius = massToRadius(aMass);
  const bMass = 20;
  const bRadius = massToRadius(bMass);

  // Close enough (A overlaps center of B)
  assert.strictEqual(
    canEat(aMass, aRadius, 100, 100, bMass, bRadius, 110, 110),
    true,
    'Should be able to eat if within size ratio and distance'
  );

  // Too far away
  assert.strictEqual(
    canEat(aMass, aRadius, 100, 100, bMass, bRadius, 200, 200),
    false,
    'Should NOT eat if distance is too far'
  );

  // B is too big (A is mass 30, B is mass 30 - no eating)
  assert.strictEqual(
    canEat(30, massToRadius(30), 100, 100, 30, massToRadius(30), 101, 101),
    false,
    'Should NOT eat if mass ratio is not at least 1.1x'
  );
});

test('Physics - clamp math utility', () => {
  assert.strictEqual(clamp(15, 10, 20), 15);
  assert.strictEqual(clamp(5, 10, 20), 10);
  assert.strictEqual(clamp(25, 10, 20), 20);
});

test('Game Engine - Player management', () => {
  const game = new Game();

  // Add player
  const player = game.addPlayer('test-socket-id', 'GigaChad', 'gigachad');
  assert.strictEqual(game.players.size, 1);
  assert.strictEqual(player.name, 'GigaChad');
  assert.strictEqual(player.skin, 'gigachad');
  assert.strictEqual(player.nodes.length, 1, 'Spawn node count must be 1');
  assert.strictEqual(player.nodes[0].mass, 30, 'Spawn mass must be 30');

  // Input register
  game.handleInput('test-socket-id', Math.PI, 0.8);
  assert.strictEqual(player.targetAngle, Math.PI);
  assert.strictEqual(player.targetSpeed, 0.8);

  // Remove player
  game.removePlayer('test-socket-id');
  assert.strictEqual(game.players.size, 0);
});

test('Game Engine - Game ticking and ring shrinking', () => {
  const game = new Game();
  const initialRadius = game.ringRadius;

  // Run tick for 1 second
  game.tick(1.0);
  assert.ok(
    game.ringRadius < initialRadius,
    'Sunrise border ring must shrink on tick'
  );
  assert.strictEqual(
    game.timer,
    game.roundDuration - 1.0,
    'Timer must decrement by dt'
  );
});

test('Game Engine - Kentongan food speed boost', () => {
  const game = new Game();
  const player = game.addPlayer('test-socket', 'Sigma', 'gigachad');

  // Set food manually and trigger collision
  game.food = [
    {
      id: 999,
      x: player.nodes[0].x,
      y: player.nodes[0].y,
      mass: 10,
      type: 'kentongan',
      color: '#fff',
    },
  ];
  game.handleCollisions();

  assert.ok(
    player.speedMultiplier > 1.0,
    'Eating a kentongan must trigger speed boost'
  );
  assert.strictEqual(
    player.speedMultiplierTimer,
    4.0,
    'Timer must start at 4 seconds'
  );

  // Decrement timer
  game.tick(1.0);
  assert.strictEqual(
    player.speedMultiplierTimer,
    3.0,
    'Timer must decrement by dt'
  );

  // End timer
  game.tick(3.0);
  assert.strictEqual(
    player.speedMultiplier,
    1.0,
    'Speed must return to normal after timer ends'
  );
});

test('Game Engine - Panci food heavy mass and slow', () => {
  const game = new Game();
  const player = game.addPlayer('test-socket', 'Sigma', 'gigachad');
  const initialMass = player.getCombinedMass();

  // Eat panci
  game.food = [
    {
      id: 999,
      x: player.nodes[0].x,
      y: player.nodes[0].y,
      mass: 10,
      type: 'panci',
      color: '#fff',
    },
  ];
  game.handleCollisions();

  assert.ok(
    player.getCombinedMass() > initialMass + 10,
    'Panci must give extra heavy mass'
  );
  assert.ok(player.speedMultiplier < 1.0, 'Panci must apply slow multiplier');
});

test('Game Engine - Megaphone shield invincibility against Sleeper', () => {
  const game = new Game();
  const player = game.addPlayer('test-socket', 'Sigma', 'gigachad');
  const initialNodeCount = player.nodes.length;

  // Eat Megaphone Toa
  game.food = [
    {
      id: 999,
      x: player.nodes[0].x,
      y: player.nodes[0].y,
      mass: 10,
      type: 'toa',
      color: '#fff',
    },
  ];
  game.handleCollisions();

  assert.ok(player.shieldTimer > 0, 'Megaphone must activate shield');

  // Collide with Angry Sleeper
  const alarm = game.alarms[0];
  // Teleport player node to Angry Sleeper
  player.nodes[0].x = alarm.x;
  player.nodes[0].y = alarm.y;
  player.nodes[0].updateMass(150); // make it larger than sleeper mass (120) to trigger collision

  game.handleCollisions();

  assert.strictEqual(
    player.nodes.length,
    initialNodeCount,
    'Should NOT explode since shield is active'
  );
  assert.ok(player.nodes[0].mass > 150, 'Should gain the sleeper mass');
});
