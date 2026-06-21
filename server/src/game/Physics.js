/**
 * Pure physics and math calculations for Sahur.io
 */

export const MAP_SIZE = 3000; // 3000x3000px arena
export const TICK_RATE = 30; // 30 ticks per second
export const ALARM_COUNT = 15; // Number of alarm clocks (viruses)
export const MAX_FOOD = 250; // Max food items on map

/**
 * Calculate radius from mass.
 * @param {number} mass
 * @returns {number}
 */
export function massToRadius(mass) {
  return 8 + Math.sqrt(mass) * 3.5;
}

/**
 * Calculate player speed based on mass (larger players move slower).
 * @param {number} mass
 * @returns {number}
 */
export function getSpeedByMass(mass) {
  // Base speed is 220, decays with mass, but has a minimum speed of 45
  return Math.max(45, 220 / Math.sqrt(mass / 10 + 0.9));
}

/**
 * Compute Euclidean distance between two points.
 */
export function getDistance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

/**
 * Check if a player circle can eat another circle (food, alarm, or another player).
 * Classic Agar.io rule: circle A can eat circle B if circle A's mass is at least 1.1x circle B's mass,
 * and they overlap significantly (e.g. B's center is inside A's radius).
 */
export function canEat(aMass, aRadius, aX, aY, bMass, bRadius, bX, bY) {
  if (aMass < bMass * 1.1) return false;
  const dist = getDistance(aX, aY, bX, bY);
  // Eat if the smaller circle's center is inside the larger circle's boundary
  return dist < aRadius - bRadius / 3;
}

/**
 * Constrain a value between min and max.
 */
export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Update entity position based on velocity, direction, and time step.
 * Returns new { x, y } clamped to map bounds.
 */
export function updatePosition(x, y, dx, dy, speed, dt, radius) {
  const newX = clamp(x + dx * speed * dt, radius, MAP_SIZE - radius);
  const newY = clamp(y + dy * speed * dt, radius, MAP_SIZE - radius);
  return { x: newX, y: newY };
}

/**
 * Calculate physics split for a player node.
 * Returns the second node's starting coordinates and velocity boost.
 */
export function calculateSplit(x, y, angle, radius) {
  // Split offset is 1.5x radius in the direction of movement
  const ejectDist = radius * 1.5;
  const targetX = clamp(
    x + Math.cos(angle) * ejectDist,
    radius,
    MAP_SIZE - radius
  );
  const targetY = clamp(
    y + Math.sin(angle) * ejectDist,
    radius,
    MAP_SIZE - radius
  );
  return {
    x: targetX,
    y: targetY,
    vx: Math.cos(angle) * 300, // Velocity boost X
    vy: Math.sin(angle) * 300, // Velocity boost Y
  };
}
