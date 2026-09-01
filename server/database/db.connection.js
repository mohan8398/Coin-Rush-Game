import mysql from 'mysql2/promise';
import { DB, LEADERBOARD } from '../config.js';

let pool = null;

export async function init() {
  try {
    const tempConn = await mysql.createConnection({
      host: DB.HOST,
      port: DB.PORT,
      user: DB.USER,
      password: DB.PASSWORD,
    });

    await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB.NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await tempConn.end();

    pool = mysql.createPool({
      host: DB.HOST,
      port: DB.PORT,
      user: DB.USER,
      password: DB.PASSWORD,
      database: DB.NAME,
      waitForConnections: true,
      connectionLimit: DB.CONNECTION_LIMIT,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });

    await pool.query(`
      CREATE TABLE IF NOT EXISTS all_time_scores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        score INT NOT NULL DEFAULT 0,
        room_code VARCHAR(10) NOT NULL,
        played_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_scores_score (score DESC),
        INDEX idx_scores_username (username)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS game_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_code VARCHAR(10) NOT NULL,
        started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        finished_at DATETIME NULL,
        player_count INT NOT NULL DEFAULT 0,
        total_coins INT NOT NULL DEFAULT 0,
        INDEX idx_sessions_room (room_code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log(`MySQL connected successfully to '${DB.NAME}' on ${DB.HOST}:${DB.PORT}`);
  } catch (err) {
    console.error(`MySQL error: ${err.message}`);
  }
}

export async function saveGameScores(roomCode, scores) {
  if (!pool) return;
  const validScores = scores.filter((s) => s.score > 0);
  if (validScores.length === 0) return;

  try {
    const values = validScores.map((s) => [s.username, s.score, roomCode]);
    const query = `INSERT INTO all_time_scores (username, score, room_code) VALUES ?`;
    await pool.query(query, [values]);
  } catch (err) {
    return Promise.reject(err);
  }
}

export async function getAllTimeLeaderboard() {
  if (!pool) return [];
  try {
    const query = `
      SELECT
        username,
        MAX(score) AS best_score,
        COUNT(*) AS games_played,
        MAX(played_at) AS last_played
      FROM all_time_scores
      GROUP BY username
      ORDER BY best_score DESC
      LIMIT ?`;
    const [rows] = await pool.query(query, [LEADERBOARD.TOP_N]);

    return rows.map((row, i) => ({
      rank: i + 1,
      username: row.username,
      score: row.best_score,
      gamesPlayed: row.games_played,
      lastPlayed: row.last_played,
    }));
  } catch (err) {
    return Promise.reject(err);
  }
}

export async function logSessionStart(roomCode, playerCount, totalCoins) {
  if (!pool) return 0;
  try {
    const query = `INSERT INTO game_sessions (room_code, player_count, total_coins) VALUES (?, ?, ?)`;
    const [result] = await pool.query(query, [roomCode, playerCount, totalCoins]);
    return result.insertId;
  } catch (err) {
    return Promise.reject(err);
  }
}

export async function logSessionEnd(sessionId) {
  if (!pool || !sessionId) return;
  try {
    const query = `UPDATE game_sessions SET finished_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await pool.query(query, [sessionId]);
  } catch (err) {
    return Promise.reject(err);
  }
}

export default {
  init,
  saveGameScores,
  getAllTimeLeaderboard,
  logSessionStart,
  logSessionEnd,
};
