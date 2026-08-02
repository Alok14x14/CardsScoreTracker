function ScoreTable({ game, totals, onEditRound, isCreator = false }) {
  if (!game) return null;

  const { players = [], rounds = [], totalRounds = 5, firstPlayerIndex = 0 } = game;
  const totalRoundsCount = totalRounds || 5;

  // Get the starter index for a given round (0-indexed round)
  const getStarterIndex = (roundIndex) => (firstPlayerIndex + roundIndex) % 4;

  // Find current leader (from completed rounds only)
  const leaderName = Object.entries(totals).reduce(
    (best, [name, score]) => (score > best.score ? { name, score } : best),
    { name: '', score: -Infinity }
  ).name;

  // Check if any completed round exists
  const hasCompletedRound = rounds.some((r) => r.status === 'completed');

  const getScoreClass = (score) => {
    if (score > 0) return 'score-positive';
    if (score < 0) return 'score-negative';
    return 'score-zero';
  };

  const formatScore = (score) => {
    if (score > 0) return `+${score}`;
    return `${score}`;
  };

  // Generate array of round numbers [1, 2, ..., totalRoundsCount]
  const roundNumbers = Array.from({ length: totalRoundsCount }, (_, i) => i + 1);

  return (
    <div className="score-table-wrapper">
      <table className="score-table">
        <thead>
          <tr>
            <th>Round</th>
            {players.map((name) => (
              <th
                key={name}
                className={`player-header ${
                  hasCompletedRound && name === leaderName ? 'leader-header' : ''
                }`}
              >
                {name}
                {hasCompletedRound && name === leaderName && (
                  <span className="crown">👑</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {roundNumbers.map((rNum, ri) => {
            const round = rounds.find((r) => r.roundNumber === rNum);
            const isPlayed = !!round;
            const isPending = round?.status === 'calling';
            const starterIndex = getStarterIndex(ri);
            const starterName = players[starterIndex];

            return (
              <tr
                key={rNum}
                className={`${isPending ? 'round-pending' : ''} ${!isPlayed ? 'round-upcoming' : ''}`}
                style={{ animationDelay: `${ri * 0.05}s` }}
              >
                <td className="round-number">
                  <div className="round-label-row">
                    <span>
                      R{rNum}
                      {isPending && (
                        <span className="round-status-badge">🎴 Playing</span>
                      )}
                      {!isPlayed && (
                        <span className="round-status-badge upcoming">Upcoming</span>
                      )}
                    </span>
                    {isPlayed && isCreator && onEditRound && (
                      <button
                        className="edit-round-btn"
                        onClick={() => onEditRound(round)}
                        title={isPending ? 'Edit calls' : 'Edit tricks'}
                        id={`edit-round-${rNum}`}
                      >
                        ✏️
                      </button>
                    )}
                  </div>
                </td>
                {players.map((playerName) => {
                  const isStarter = playerName === starterName;
                  const ps = round?.scores?.find((s) => s.playerName === playerName);

                  if (!isPlayed) {
                    return (
                      <td key={playerName} className="upcoming-cell">
                        <div className="score-cell">
                          {isStarter ? (
                            <span className="starter-pill" title={`${playerName} starts Round ${rNum}`}>
                              🎯 Starts
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </div>
                      </td>
                    );
                  }

                  if (isPending) {
                    return (
                      <td key={playerName}>
                        <div className="score-cell">
                          <span className="call-display">
                            {isStarter && (
                              <span className="starter-pill" title="Started this round">
                                🎯 Starts
                              </span>
                            )}
                            Called {ps?.call}
                          </span>
                          <span className="tricks-pending">⏳ playing...</span>
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td key={playerName}>
                      <div className="score-cell">
                        <span className="call-tricks">
                          {isStarter && (
                            <span className="starter-pill" title="Started this round">
                              🎯 Starts
                            </span>
                          )}
                          {ps?.call} called · {ps?.tricks} won
                        </span>
                        <span
                          className={`round-score ${getScoreClass(
                            ps?.roundScore
                          )}`}
                        >
                          {formatScore(ps?.roundScore)}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td>Total</td>
            {players.map((name) => (
              <td key={name} className={getScoreClass(totals[name] || 0)}>
                {formatScore(totals[name] || 0)}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default ScoreTable;
