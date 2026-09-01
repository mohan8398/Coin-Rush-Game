import React, { useState } from 'react';
import LeaderboardList from '../components/LeaderboardList';

export default function LandingScreen({
  username,
  setUsername,
  onCreateRoom,
  onJoinRoom,
  allTimeScores,
  errorMessage,
}) {
  const [code, setCode] = useState('');

  const handleCreate = () => {
    onCreateRoom();
  };

  const handleJoin = () => {
    onJoinRoom(code);
  };

  return (
    <div className="screen active" id="screen-landing">
      <div className="landing-bg">
        <div className="particle" style={{ '--x': '10%', '--y': '20%', '--d': '3s', '--s': 0.6 }}></div>
        <div className="particle" style={{ '--x': '80%', '--y': '70%', '--d': '4s', '--s': 0.4 }}></div>
        <div className="particle" style={{ '--x': '50%', '--y': '50%', '--d': '2.5s', '--s': 0.8 }}></div>
        <div className="particle" style={{ '--x': '20%', '--y': '80%', '--d': '5s', '--s': 0.3 }}></div>
        <div className="particle" style={{ '--x': '90%', '--y': '15%', '--d': '3.5s', '--s': 0.5 }}></div>
        <div className="particle" style={{ '--x': '65%', '--y': '35%', '--d': '4.2s', '--s': 0.7 }}></div>
      </div>

      <div className="landing-content">
        <div className="logo-wrapper">
          <h1 className="logo-text">CoinRush</h1>
        </div>
        <p className="tagline">Real-time multiplayer collectible arena</p>

        <div className="card glass-card">
          <div className="form-group">
            <label htmlFor="input-username" className="form-label">
              Your Name
            </label>
            <input
              id="input-username"
              type="text"
              className="form-input"
              placeholder="Enter username…"
              maxLength={20}
              autoComplete="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
              }}
            />
          </div>

          <div className="divider">
            <span>Choose an option</span>
          </div>

          <button id="btn-create-room" className="btn btn-primary btn-lg" onClick={handleCreate}>
            Create New Room
          </button>

          <div className="join-row">
            <input
              id="input-room-code"
              type="text"
              className="form-input form-input--code"
              placeholder="Room code (e.g. AB3K9P)"
              maxLength={6}
              autoComplete="off"
              spellCheck="false"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleJoin();
              }}
            />
            <button id="btn-join-room" className="btn btn-secondary" onClick={handleJoin}>
              Join
            </button>
          </div>

          {errorMessage && (
            <div id="landing-error" className="error-msg">
              {errorMessage}
            </div>
          )}
        </div>

        <div className="card glass-card all-time-card">
          <h2 className="section-title">All-Time Leaderboard</h2>
          <LeaderboardList entries={allTimeScores} myUsername={username} />
        </div>
      </div>
    </div>
  );
}
