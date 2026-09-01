import React, { useState, useEffect, useCallback } from 'react';
import {
  connectSocket,
  onEvent,
  emitEvent,
  getSocketId,
} from './services/socket';
import LandingScreen from './screens/LandingScreen';
import LobbyScreen from './screens/LobbyScreen';
import GameScreen from './screens/GameScreen';
import GameOverScreen from './screens/GameOverScreen';
import ToastContainer from './components/ToastContainer';

export default function App() {
  const [screen, setScreen] = useState('landing');
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [hostId, setHostId] = useState('');
  const [myId, setMyId] = useState('');
  const [players, setPlayers] = useState([]);
  const [collectibles, setCollectibles] = useState([]);
  const [remainingCoins, setRemainingCoins] = useState(0);
  const [worldConfig, setWorldConfig] = useState({
    worldWidth: 1200,
    worldHeight: 750,
    playerRadius: 18,
    collectibleRadius: 14,
    tickRate: 20,
  });
  const [finalScores, setFinalScores] = useState([]);
  const [allTimeScores, setAllTimeScores] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = '') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  const loadAllTimeLeaderboard = useCallback(async () => {
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      if (data.leaderboard) {
        setAllTimeScores(data.leaderboard);
      }
    } catch (err) {
      console.warn(err);
    }
  }, []);

  useEffect(() => {
    connectSocket();
    loadAllTimeLeaderboard();

    const unsubConnect = onEvent('connect', ({ id }) => {
      setMyId(id);
    });

    const unsubPlayerJoined = onEvent('player_joined', ({ player }) => {
      setPlayers((prev) => {
        if (prev.find((p) => p.id === player.id)) return prev;
        return [...prev, player];
      });
      addToast(`${player.username} joined the lobby!`);
    });

    const unsubPlayerLeft = onEvent('player_left', ({ playerId }) => {
      setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    });

    const unsubGameStarted = onEvent('game_started', (data) => {
      const {
        players: initialPlayers,
        collectibles: initialCollectibles,
        worldWidth,
        worldHeight,
        config,
      } = data;

      setPlayers(initialPlayers);
      setCollectibles(initialCollectibles);
      setRemainingCoins(initialCollectibles.length);
      setWorldConfig({
        worldWidth,
        worldHeight,
        playerRadius: config.playerRadius,
        collectibleRadius: config.collectibleRadius,
        tickRate: config.tickRate,
      });
      setMyId(getSocketId());
      setScreen('game');
    });

    const unsubGameTick = onEvent('game_tick', ({ players: updatedPlayers }) => {
      setPlayers(updatedPlayers);
    });

    const unsubCollectibleCollected = onEvent(
      'collectible_collected',
      ({ coinId, scores }) => {
        setCollectibles((prev) => prev.filter((c) => c.id !== coinId));
        setRemainingCoins((prev) => Math.max(0, prev - 1));

        if (scores) {
          setPlayers((prev) =>
            prev.map((p) => {
              const updated = scores.find((s) => s.id === p.id);
              return updated ? { ...p, score: updated.score } : p;
            })
          );
        }
      }
    );

    const unsubGameOver = onEvent('game_over', ({ finalScores: endScores, allTimeLeaderboard }) => {
      setFinalScores(endScores);
      if (allTimeLeaderboard) {
        setAllTimeScores(allTimeLeaderboard);
      }
      setScreen('gameover');
    });

    const unsubDisconnect = onEvent('disconnect', () => {
      setScreen('landing');
      setErrorMessage('Disconnected from server. Reconnecting…');
      loadAllTimeLeaderboard();
    });

    return () => {
      unsubConnect();
      unsubPlayerJoined();
      unsubPlayerLeft();
      unsubGameStarted();
      unsubGameTick();
      unsubCollectibleCollected();
      unsubGameOver();
      unsubDisconnect();
    };
  }, [addToast, loadAllTimeLeaderboard]);

  const handleCreateRoom = () => {
    if (!username.trim()) {
      setErrorMessage('Please enter a username.');
      return;
    }
    setErrorMessage('');

    emitEvent('create_room', { username: username.trim() }, (res) => {
      if (res.error) {
        setErrorMessage(res.error);
        return;
      }
      setRoomCode(res.room.code);
      setHostId(res.room.hostId);
      setPlayers(res.room.players);
      setMyId(getSocketId());
      setScreen('lobby');
    });
  };

  const handleJoinRoom = (code) => {
    if (!username.trim()) {
      setErrorMessage('Please enter a username.');
      return;
    }
    if (!code || code.trim().length !== 6) {
      setErrorMessage('Room code must be 6 characters.');
      return;
    }
    setErrorMessage('');

    emitEvent('join_room', { roomCode: code.trim().toUpperCase(), username: username.trim() }, (res) => {
      if (res.error) {
        setErrorMessage(res.error);
        return;
      }
      setRoomCode(res.room.code);
      setHostId(res.room.hostId);
      setPlayers(res.room.players);
      setMyId(getSocketId());
      setScreen('lobby');
    });
  };

  const handleStartGame = () => {
    emitEvent('start_game', {}, (res) => {
      if (res?.error) {
        addToast(res.error, 'error');
      }
    });
  };

  const handleLeaveLobby = () => {
    emitEvent('leave_room', {});
    setScreen('landing');
    loadAllTimeLeaderboard();
  };

  const handleCopyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(roomCode)
        .then(() => addToast('Room code copied to clipboard!'))
        .catch(() => addToast(`Room code: ${roomCode}`));
    } else {
      addToast(`Room code: ${roomCode}`);
    }
  };

  const handlePlayAgain = () => {
    setScreen('landing');
    setPlayers([]);
    setCollectibles([]);
    loadAllTimeLeaderboard();
  };

  return (
    <div className="app-root">
      {screen === 'landing' && (
        <LandingScreen
          username={username}
          setUsername={setUsername}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          allTimeScores={allTimeScores}
          errorMessage={errorMessage}
        />
      )}

      {screen === 'lobby' && (
        <LobbyScreen
          roomCode={roomCode}
          players={players}
          hostId={hostId}
          myId={myId}
          onStartGame={handleStartGame}
          onLeaveLobby={handleLeaveLobby}
          onCopyCode={handleCopyCode}
        />
      )}

      {screen === 'game' && (
        <GameScreen
          roomCode={roomCode}
          players={players}
          collectibles={collectibles}
          myId={myId}
          worldConfig={worldConfig}
          remainingCoins={remainingCoins}
        />
      )}

      {screen === 'gameover' && (
        <GameOverScreen
          finalScores={finalScores}
          allTimeLeaderboard={allTimeScores}
          myUsername={username}
          myId={myId}
          onPlayAgain={handlePlayAgain}
        />
      )}

      <ToastContainer toasts={toasts} />
    </div>
  );
}
