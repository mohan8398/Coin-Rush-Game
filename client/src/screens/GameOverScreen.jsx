import React from 'react';
import LeaderboardList from '../components/LeaderboardList';

export default function GameOverScreen({
  finalScores = [],
  allTimeLeaderboard = [],
  myUsername = '',
  myId = '',
  onPlayAgain,
}) {
  const winner = finalScores[0];
  let subtitle = '';
  if (winner) {
    if (winner.id === myId) {
      subtitle = 'You won the match!';
    } else {
      subtitle = `${winner.username} won the match with ${winner.score} points!`;
    }
  }

  return (
    <div className="screen active" id="screen-gameover">
      <div className="gameover-container">
        <h2 className="gameover-title">Game Over</h2>
        <p className="gameover-subtitle" id="gameover-winner-text">
          {subtitle}
        </p>

        <div className="scores-panel">
          <h3 className="section-title">Match Final Scores</h3>
          <LeaderboardList entries={finalScores} myUsername={myUsername} />
        </div>

        <div className="scores-panel">
          <h3 className="section-title">All-Time Top 10</h3>
          <LeaderboardList entries={allTimeLeaderboard} myUsername={myUsername} />
        </div>

        <button id="btn-play-again" className="btn btn-primary btn-lg" onClick={onPlayAgain}>
          Play Again
        </button>
      </div>
    </div>
  );
}
