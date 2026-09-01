import { PLAYER, WORLD, ROOM } from './config.js';
import { spawnCollectibles } from './CollectibleSpawner.js';

export class GameRoom {
  constructor(code, hostSocketId, hostUsername) {
    this.code = code;
    this.state = 'waiting';
    this.players = new Map();
    this.collectibles = new Map();
    this.claimedCollectibles = new Set();
    this.sessionId = null;
    this.createdAt = Date.now();
    this.addPlayerInternal(hostSocketId, hostUsername, true);
  }

  addPlayer(socketId, username) {
    if (this.state !== 'waiting') return null;
    if (this.players.size >= ROOM.MAX_PLAYERS) return null;
    return this.addPlayerInternal(socketId, username, false);
  }

  addPlayerInternal(socketId, username, isHost = false) {
    const player = {
      id: socketId,
      username: username.trim().slice(0, 20),
      x: WORLD.WIDTH / 2,
      y: WORLD.HEIGHT / 2,
      inputDx: 0,
      inputDy: 0,
      score: 0,
      color: PLAYER.COLORS[this.players.size % PLAYER.COLORS.length],
      isHost,
    };
    this.players.set(socketId, player);
    return player;
  }

  removePlayer(socketId) {
    this.players.delete(socketId);
  }

  startGame() {
    if (this.state !== 'waiting') return;
    this.state = 'playing';
    let colorIndex = 0;
    const startPositions = this.generateStartPositions(this.players.size);
    let posIdx = 0;
    for (const player of this.players.values()) {
      const pos = startPositions[posIdx++];
      player.x = pos.x;
      player.y = pos.y;
      player.color = PLAYER.COLORS[colorIndex % PLAYER.COLORS.length];
      colorIndex++;
    }

    const coins = spawnCollectibles();
    this.collectibles.clear();
    this.claimedCollectibles.clear();
    for (const c of coins) {
      this.collectibles.set(c.id, c);
    }
  }

  setPlayerInput(socketId, dx, dy) {
    const player = this.players.get(socketId);
    if (!player) return;
    player.inputDx = Math.max(-1, Math.min(1, dx));
    player.inputDy = Math.max(-1, Math.min(1, dy));
  }

  tryCollect(socketId, coinId) {
    if (this.claimedCollectibles.has(coinId)) return null;

    const coin = this.collectibles.get(coinId);
    if (!coin || coin.collected) return null;

    const player = this.players.get(socketId);
    if (!player) return null;

    this.claimedCollectibles.add(coinId);
    coin.collected = true;
    player.score += coin.value;

    return coin;
  }

  isGameOver() {
    return (
      this.state === 'playing' &&
      [...this.collectibles.values()].every((c) => c.collected)
    );
  }

  finish() {
    this.state = 'finished';
  }

  get hostId() {
    return this.players.keys().next().value ?? null;
  }

  get playerCount() {
    return this.players.size;
  }

  toJSON() {
    return {
      code: this.code,
      state: this.state,
      hostId: this.hostId,
      players: [...this.players.values()].map(playerToPublic),
      collectibles: [...this.collectibles.values()].filter((c) => !c.collected),
    };
  }

  getPlayerSnapshots() {
    return [...this.players.values()].map(playerToPublic);
  }

  getScores() {
    return [...this.players.values()]
      .map((p) => ({ username: p.username, score: p.score, id: p.id }))
      .sort((a, b) => b.score - a.score);
  }

  generateStartPositions(count) {
    const positions = [];
    const margin = 120;
    const cols = Math.min(count, 4);
    const rows = Math.ceil(count / cols);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        positions.push({
          x: margin + (c / Math.max(cols - 1, 1)) * (WORLD.WIDTH - margin * 2),
          y: margin + (r / Math.max(rows - 1, 1)) * (WORLD.HEIGHT - margin * 2),
        });
      }
    }
    return positions;
  }
}

function playerToPublic(p) {
  return {
    id: p.id,
    username: p.username,
    x: Math.round(p.x),
    y: Math.round(p.y),
    score: p.score,
    color: p.color,
    isHost: p.isHost,
  };
}

export default GameRoom;
