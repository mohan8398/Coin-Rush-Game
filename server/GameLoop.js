import { TICK_RATE, PLAYER, WORLD, COLLECTIBLE } from './config.js';
import db from './database/db.connection.js';

const TICK_MS = 1000 / TICK_RATE;

export class GameLoop {
  constructor(io, roomManager) {
    this.io = io;
    this.roomManager = roomManager;
    this.interval = null;
    this.lastTick = Date.now();
  }

  start() {
    if (this.interval) return;
    this.interval = setInterval(() => this.tick(), TICK_MS);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  tick() {
    const now = Date.now();
    const dt = (now - this.lastTick) / 1000;
    this.lastTick = now;

    for (const room of this.roomManager.rooms.values()) {
      if (room.state !== 'playing') continue;
      this.processRoom(room, dt);
    }
  }

  processRoom(room, dt) {
    const collectedThisTick = [];

    for (const player of room.players.values()) {
      const mag = Math.sqrt(player.inputDx ** 2 + player.inputDy ** 2) || 1;
      const nx = player.inputDx / mag;
      const ny = player.inputDy / mag;

      player.x += nx * PLAYER.SPEED * dt;
      player.y += ny * PLAYER.SPEED * dt;

      player.x = Math.max(PLAYER.RADIUS, Math.min(WORLD.WIDTH - PLAYER.RADIUS, player.x));
      player.y = Math.max(PLAYER.RADIUS, Math.min(WORLD.HEIGHT - PLAYER.RADIUS, player.y));

      const pickupRange = PLAYER.RADIUS + COLLECTIBLE.RADIUS;
      for (const coin of room.collectibles.values()) {
        if (coin.collected) continue;

        const dx = coin.x - player.x;
        const dy = coin.y - player.y;
        if (dx * dx + dy * dy <= pickupRange * pickupRange) {
          const claimed = room.tryCollect(player.id, coin.id);
          if (claimed) {
            collectedThisTick.push({ coin: claimed, player });
          }
        }
      }
    }

    for (const { coin, player } of collectedThisTick) {
      this.io.to(room.code).emit('collectible_collected', {
        coinId: coin.id,
        collectorId: player.id,
        collectorName: player.username,
        scores: room.getScores(),
      });
    }

    this.io.to(room.code).emit('game_tick', {
      players: room.getPlayerSnapshots(),
      ts: Date.now(),
    });

    if (room.isGameOver()) {
      this.handleGameOver(room);
    }
  }

  async handleGameOver(room) {
    room.finish();

    const scores = room.getScores();
    try {
      await db.saveGameScores(room.code, scores);
      if (room.sessionId) await db.logSessionEnd(room.sessionId);
    } catch (err) {
      console.error(err);
    }

    const allTimeLeaderboard = await db.getAllTimeLeaderboard();

    this.io.to(room.code).emit('game_over', {
      finalScores: scores,
      allTimeLeaderboard,
    });

    this.roomManager.scheduleCleanup(room.code);
  }
}

export default GameLoop;
