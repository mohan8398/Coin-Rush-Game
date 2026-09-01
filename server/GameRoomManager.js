import GameRoom from './GameRoom.js';
import { ROOM } from './config.js';

export class GameRoomManager {
  constructor() {
    this.rooms = new Map();
  }

  createRoom(hostSocketId, hostUsername) {
    const code = this.generateUniqueCode();
    const room = new GameRoom(code, hostSocketId, hostUsername);
    this.rooms.set(code, room);
    return room;
  }

  getRoom(code) {
    if (!code) return null;
    return this.rooms.get(code.toUpperCase());
  }

  joinRoom(code, socketId, username) {
    const room = this.getRoom(code);
    if (!room) return { error: 'Room not found. Check the code and try again.' };
    if (room.state !== 'waiting') return { error: 'Game already started in that room.' };
    if (room.playerCount >= ROOM.MAX_PLAYERS) return { error: 'Room is full.' };

    const player = room.addPlayer(socketId, username);
    if (!player) return { error: 'Could not join room.' };

    return { room, player };
  }

  getRoomBySocket(socketId) {
    for (const room of this.rooms.values()) {
      if (room.players.has(socketId)) return room;
    }
    return null;
  }

  removePlayer(socketId) {
    const room = this.getRoomBySocket(socketId);
    if (!room) return null;

    room.removePlayer(socketId);

    if (room.playerCount === 0) {
      this.scheduleCleanup(room.code, 0);
    }

    return room;
  }

  deleteRoom(code) {
    this.rooms.delete(code);
    console.log(`Room Deleted room ${code}`);
  }

  scheduleCleanup(code, delay = ROOM.CLEANUP_DELAY_MS) {
    setTimeout(() => {
      const room = this.rooms.get(code);
      if (room && (room.state === 'finished' || room.playerCount === 0)) {
        this.deleteRoom(code);
      }
    }, delay);
  }

  generateUniqueCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code;
    do {
      code = Array.from({ length: ROOM.CODE_LENGTH }, () =>
        chars[Math.floor(Math.random() * chars.length)]
      ).join('');
    } while (this.rooms.has(code));
    return code;
  }

  getRoomSummaries() {
    return [...this.rooms.values()].map((r) => ({
      code: r.code,
      state: r.state,
      players: r.playerCount,
    }));
  }
}

export default GameRoomManager;
