export default function LeaderboardList({ entries = [], myUsername = '' }) {
  if (!entries || entries.length === 0) {
    return <div className="lb-loading">No scores recorded yet.</div>;
  }

  return (
    <div className="leaderboard-list">
      {entries.map((entry, index) => {
        const rank = entry.rank ?? index + 1;
        const isMe = myUsername && entry.username?.toLowerCase() === myUsername?.toLowerCase();

        return (
          <div key={entry.id || entry.username || index} className={`lb-row ${isMe ? 'lb-row--me' : ''}`}>
            <span className="lb-rank">#{rank}</span>
            <span className="lb-name">{entry.username}</span>
            <span className="lb-score">{entry.score}</span>
          </div>
        );
      })}
    </div>
  );
}
