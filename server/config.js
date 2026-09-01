import dotenv from 'dotenv';
dotenv.config();

export const DB = {
  HOST: process.env.DB_HOST || 'localhost',
  PORT: parseInt(process.env.DB_PORT, 10) || 3306,
  USER: process.env.DB_USER || 'root',
  PASSWORD: process.env.DB_PASSWORD || '',
  NAME: process.env.DB_NAME || 'coinrush_db',
  CONNECTION_LIMIT: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,
};

export const PORT = process.env.PORT || 3000;

export const WORLD = {
  WIDTH: 1200,
  HEIGHT: 750,
};

export const PLAYER = {
  RADIUS: 18,
  SPEED: 200,
  COLORS: [
    '#6C63FF', '#FF6584', '#43E97B', '#F7971E',
    '#12C2E9', '#F64F59', '#C471ED', '#43B89C',
  ],
};

export const COLLECTIBLE = {
  COUNT: 30,
  RADIUS: 14,
  SCORE_VALUE: 10,
  MARGIN: 60,
};

export const ROOM = {
  CODE_LENGTH: 6,
  MAX_PLAYERS: 8,
  MIN_PLAYERS_TO_START: 1,
  CLEANUP_DELAY_MS: 30_000,
  INACTIVITY_TIMEOUT_MS: 300_000,
};

export const TICK_RATE = 20;

export const LEADERBOARD = {
  TOP_N: 10,
};

export default {
  DB,
  PORT,
  WORLD,
  PLAYER,
  COLLECTIBLE,
  ROOM,
  TICK_RATE,
  LEADERBOARD,
};
