import { io } from 'socket.io-client';

let socket = null;
const handlers = {};

function trigger(event, data) {
  (handlers[event] || []).forEach((fn) => fn(data));
}

export function connectSocket() {
  if (socket && socket.connected) return socket;

  socket = io({ transports: ['websocket', 'polling'] });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id);
    trigger('connect', { id: socket.id });
  });

  socket.on('disconnect', (reason) => {
    console.warn('[Socket] Disconnected:', reason);
    trigger('disconnect', { reason });
  });

  const SERVER_EVENTS = [
    'room_state',
    'player_joined',
    'player_left',
    'game_started',
    'game_tick',
    'collectible_collected',
    'game_over',
    'error',
  ];

  for (const ev of SERVER_EVENTS) {
    socket.on(ev, (data) => {
      trigger(ev, data);
    });
  }

  return socket;
}

export function onEvent(event, fn) {
  if (!handlers[event]) handlers[event] = [];
  handlers[event].push(fn);
  return () => offEvent(event, fn);
}

export function offEvent(event, fn) {
  if (!handlers[event]) return;
  handlers[event] = handlers[event].filter((h) => h !== fn);
}

export function emitEvent(event, data = {}, ack) {
  if (!socket) connectSocket();
  if (ack) {
    socket.emit(event, data, ack);
  } else {
    socket.emit(event, data);
  }
}

export function getSocketId() {
  return socket?.id ?? null;
}

export function isSocketConnected() {
  return socket?.connected ?? false;
}
