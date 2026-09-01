export default function LobbyScreen({
  roomCode,
  players = [],
  hostId,
  myId,
  onStartGame,
  onLeaveLobby,
  onCopyCode,
}) {
  const isHost = hostId === myId;
  const maxPlayers = 8;
  const emptySlotsCount = Math.max(0, Math.min(maxPlayers - players.length, 4));

  return (
    <div className="screen active" id="screen-lobby">
      <div className="lobby-container">
        <div className="lobby-header">
          <div>
            <h2 className="lobby-title">Waiting for players…</h2>
            <div className="room-code-display">
              Room code: <strong id="lobby-room-code">{roomCode}</strong>
              <button id="btn-copy-code" className="btn btn-ghost btn-sm" title="Copy code" onClick={onCopyCode}>
                Copy
              </button>
            </div>
          </div>
          <button id="btn-leave-lobby" className="btn btn-ghost btn-sm" onClick={onLeaveLobby}>
            Leave
          </button>
        </div>

        <div className="player-grid" id="lobby-player-grid">
          {players.map((p, i) => {
            const initial = (p.username || 'P').charAt(0).toUpperCase();
            return (
              <div key={p.id || i} className="player-card">
                <div
                  className="player-avatar"
                  style={{
                    background: p.color || '#6366f1',
                  }}
                >
                  {initial}
                </div>
                <div className="player-name-tag">{p.username}</div>
                {p.id === hostId && <div className="player-badge">Host</div>}
              </div>
            );
          })}

          {Array.from({ length: emptySlotsCount }).map((_, i) => (
            <div key={`slot-${i}`} className="player-card player-slot">
              <div className="player-avatar">—</div>
            </div>
          ))}
        </div>

        <div className="lobby-footer">
          <p id="lobby-status" className="lobby-status-text">
            {isHost
              ? `${players.length} player(s) ready. Press Start Game!`
              : 'Waiting for the host to start the game…'}
          </p>
          <button
            id="btn-start-game"
            className="btn btn-primary btn-lg"
            disabled={!isHost}
            onClick={onStartGame}
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
}
