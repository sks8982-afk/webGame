// Design Ref: §4.4 — CombatSystem probability calculations

/**
 * Returns true with the given probability (0.0 to 1.0).
 */
export function chance(probability: number): boolean {
  return Math.random() < probability;
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Returns a random float between min (inclusive) and max (exclusive).
 */
export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Weighted random selection from items with weights.
 * Returns the index of the selected item.
 */
export function weightedRandom(weights: readonly number[]): number {
  const total = weights.reduce((sum, w) => sum + w, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return i;
  }
  return weights.length - 1;
}

/**
 * Pick a random element from an array.
 */
export function randomPick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}
