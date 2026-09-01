# CoinRush 🪙 — Real-Time Multiplayer Game

A real-time multiplayer collectibles game built with **Node.js + Express + Socket.IO** and MySQL for leaderboard.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Server runtime | Node.js |
| HTTP framework | Express |
| WebSockets | Socket.IO|
| Database | MySQL|
| Frontend | React + Vite |

---

## Environment Variables & Configuration

Create a `.env` file in the project root (see [.env.example]):

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=coinrush_db
DB_CONNECTION_LIMIT=10
```

The server will automatically create the database `coinrush_db` and all required tables (`all_time_scores`, `game_sessions`) upon startup.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Build the React frontend
npm run build

For full-stack live-reload development:
```bash
npm run dev
# Starts backend server (port 3000) and Vite React dev server (port 5173 with proxy)
```

---

## How to Play

1. **Enter a username** on the landing page
2. **Create a room** (you become the host) or **enter a code** to join
3. Share the 6-character room code with friends
4. The **host** presses **Start Game** when everyone is ready
5. Use **WASD** or **Arrow keys** to move (mobile: on-screen D-pad)
6. Walk over coins to collect them — **the server awards the point**
7. First to collect all 30 coins… well, the last coin ends the game!
8. Final leaderboard and **all-time top 10** shown at game over

---

## Key Backend Design Decisions

### Game Model
- Clients send **direction intent** (`dx`, `dy`) — never a position
- The server runs a **20 Hz game loop** that moves players, detects collisions, and awards scores
- A `Set`-based mutex in `GameRoom.tryCollect()` ensures exactly one player wins each coin, even under concurrent socket events

### Anti-Double-Award Mechanism
```js
tryCollect(socketId, coinId) {
  if (this.claimedCollectibles.has(coinId)) return null;
}
```

### Multiple Game Rooms
- Rooms identified by unique 6-char codes 
- Room states: `waiting → playing → finished`

### DATABASE (Bonus ✓)
- **MYSQL**
- `GET /api/leaderboard` returns all-time top 10 by personal best score
- Leaderboard shown on landing page and game-over screen

### Client-Side
- Canvas renders at **60 fps** with linear interpolation between 20 Hz server snapshots
- Players appear perfectly smooth regardless of tick rate

---

## REST Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/api/leaderboard` | All-time top 10 |
| `GET` | `/api/rooms` | Active room summary |

---

