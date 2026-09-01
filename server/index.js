import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

import config from './config.js';
import db from './database/db.connection.js';
import GameRoomManager from './GameRoomManager.js';
import GameLoop from './GameLoop.js';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
  pingTimeout: 20000,
  pingInterval: 10000,
});

app.use(express.json());

const distPath = path.join(dirname, '../dist');
app.use(express.static(distPath));

app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.get('/api/leaderboard', async (_req, res) => {
  try {
    const leaderboard = await db.getAllTimeLeaderboard();
    res.json({ leaderboard });
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/rooms', (_req, res) => {
  res.json({ rooms: roomManager.getRoomSummaries() });
});

app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('React client not built yet. Run `npm run build` or start Vite via `npm run dev`.');
  }
});

const roomManager = new GameRoomManager();
const gameLoop = new GameLoop(io, roomManager);
gameLoop.start();

io.on('connection', (socket) => {
  console.log(`Socket Connected: ${socket.id}`);

  socket.on('create_room', ({ username }, ack) => {
    if (!isValidUsername(username)) {
      return ack?.({ error: 'Invalid username (1-20 chars).' });
    }

    const room = roomManager.createRoom(socket.id, username);
    socket.join(room.code);

    ack?.({ room: room.toJSON() });
    console.log(`Socket ${username} created room ${room.code}`);
  });

  socket.on('join_room', ({ roomCode, username }, ack) => {
    if (!isValidUsername(username)) {
      return ack?.({ error: 'Invalid username (1-20 chars).' });
    }

    const result = roomManager.joinRoom(roomCode, socket.id, username);
    if (result.error) return ack?.({ error: result.error });

    const { room, player } = result;
    socket.join(room.code);

    socket.to(room.code).emit('player_joined', {
      player: {
        id: player.id,
        username: player.username,
        color: player.color,
        isHost: player.isHost,
        score: player.score,
      },
    });

    ack?.({ room: room.toJSON() });
    console.log(`Socket ${username} joined room ${room.code}`);
  });

  socket.on('start_game', async (_, ack) => {
    const room = roomManager.getRoomBySocket(socket.id);

    if (!room) return ack?.({ error: 'Not in a room.' });
    if (room.hostId !== socket.id) return ack?.({ error: 'Only the host can start.' });
    if (room.state !== 'waiting') return ack?.({ error: 'Game already started.' });
    if (room.playerCount < config.ROOM.MIN_PLAYERS_TO_START) {
      return ack?.({ error: `Need at least ${config.ROOM.MIN_PLAYERS_TO_START} player(s).` });
    }

    room.startGame();

    try {
      room.sessionId = await db.logSessionStart(room.code, room.playerCount, config.COLLECTIBLE.COUNT);
    } catch (e) {
      console.error(e);
    }

    const snapshot = room.toJSON();
    io.to(room.code).emit('game_started', {
      players: snapshot.players,
      collectibles: snapshot.collectibles,
      worldWidth: config.WORLD.WIDTH,
      worldHeight: config.WORLD.HEIGHT,
      config: {
        playerRadius: config.PLAYER.RADIUS,
        collectibleRadius: config.COLLECTIBLE.RADIUS,
        tickRate: config.TICK_RATE,
      },
    });

    ack?.({ ok: true });
    console.log(`Socket Room ${room.code} game started with ${room.playerCount} players`);
  });

  socket.on('player_input', ({ dx, dy }) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room || room.state !== 'playing') return;
    room.setPlayerInput(socket.id, dx, dy);
  });

  socket.on('leave_room', () => {
    handleLeave(socket);
  });

  socket.on('disconnect', (reason) => {
    console.log(`Socket Disconnected: ${socket.id} (${reason})`);
    handleLeave(socket);
  });
});

function handleLeave(socket) {
  const room = roomManager.removePlayer(socket.id);
  if (!room) return;

  socket.leave(room.code);

  io.to(room.code).emit('player_left', {
    playerId: socket.id,
    playerCount: room.playerCount,
  });

  if (room.state === 'playing' && room.playerCount === 0) {
    room.finish();
    roomManager.scheduleCleanup(room.code);
  }
}

function isValidUsername(name) {
  return typeof name === 'string' && name.trim().length >= 1 && name.trim().length <= 20;
}

(async () => {
  await db.init();

  httpServer.listen(config.PORT, () => {
    console.log(`Game server running at http://localhost:${config.PORT}`);
  });
})();

export { app, io };
