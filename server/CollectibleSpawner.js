import { WORLD, COLLECTIBLE } from './config.js';
import { v4 as uuidv4 } from 'uuid';

export function spawnCollectibles(count = COLLECTIBLE.COUNT) {
  const margin = COLLECTIBLE.MARGIN;
  const minSpacing = COLLECTIBLE.RADIUS * 4;
  const collectibles = [];
  const maxAttempts = count * 100;

  let attempts = 0;
  while (collectibles.length < count && attempts < maxAttempts) {
    attempts++;

    const x = margin + Math.random() * (WORLD.WIDTH - margin * 2);
    const y = margin + Math.random() * (WORLD.HEIGHT - margin * 2);

    const tooClose = collectibles.some((c) => {
      const dx = c.x - x;
      const dy = c.y - y;
      return Math.sqrt(dx * dx + dy * dy) < minSpacing;
    });

    if (!tooClose) {
      collectibles.push({
        id: uuidv4(),
        x: Math.round(x),
        y: Math.round(y),
        value: COLLECTIBLE.SCORE_VALUE,
        collected: false,
      });
    }
  }

  if (collectibles.length < count) {
    console.warn(`Only spawned ${collectibles.length}/${count} collectibles (world too small?)`);
  }

  return collectibles;
}

export default { spawnCollectibles };
