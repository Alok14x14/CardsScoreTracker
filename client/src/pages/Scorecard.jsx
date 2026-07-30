import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGame, createGame, submitCalls, submitTricks, editCalls } from '../api';
import ScoreTable from '../components/ScoreTable';
import { CallsModal, TricksModal } from '../components/AddRoundModal';

// Generate confetti pieces
function createConfetti() {
  const colors = [
    '#6366f1', '#a855f7', '#ec4899', '#34d399',
    '#fbbf24', '#22d3ee', '#fb7185', '#f97316',
  ];
  const pieces = [];
  for (let i = 0; i < 60; i++) {
    pieces.push({
      id: i,
      left: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 3,
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
    });
  }
  return pieces;
}

function Scorecard() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [totals, setTotals] = useState({});
  const [loading, setLoading] = useState(true);
  const [rematchLoading, setRematchLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCallsModal, setShowCallsModal] = useState(false);
  const [showTricksModal, setShowTricksModal] = useState(false);
  const [editingRound, setEditingRound] = useState(null); // round being edited
  const [toast, setToast] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiPieces] = useState(createConfetti);

  const fetchGame = useCallback(async () => {
    try {
      const data = await getGame(code);
      setGame(data.game);
      setTotals(data.totals);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Game not found.');
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    fetchGame();
  }, [fetchGame]);

  // Check if there's a round waiting for tricks
  const pendingRound = game?.rounds?.find((r) => r.status === 'calling');
  const isComplete = game?.status === 'completed';
  const roundsPlayed = game?.rounds?.filter((r) => r.status === 'completed').length || 0;
  const totalRoundsCount = game?.totalRounds || 5;
  const totalRoundsStarted = game?.rounds?.length || 0;
  const firstPlayerIndex = game?.firstPlayerIndex ?? 0;

  // Who starts the next round in current game (round-robin)
  const nextStarterIndex = (firstPlayerIndex + totalRoundsStarted) % 4;
  const nextStarterName = game?.players?.[nextStarterIndex] || '';

  // Who starts the first round of the NEXT game (rematch)
  const nextGameFirstPlayerIndex = (firstPlayerIndex + 1) % 4;
  const nextGameFirstPlayerName = game?.players?.[nextGameFirstPlayerIndex] || '';

  // Handle rematch with same players, rotating first-round starter to next player
  const handleRematch = async () => {
    setRematchLoading(true);
    try {
      const data = await createGame(game.players, game.totalRounds, nextGameFirstPlayerIndex);
      showToastMessage('Starting new game...');
      navigate(`/game/${data.game.gameCode}`);
    } catch (err) {
      showToastMessage(err.response?.data?.error || 'Failed to start rematch.');
      setRematchLoading(false);
    }
  };

  // Step 1: Submit new calls
  const handleSubmitCalls = async (playerCalls) => {
    const data = await submitCalls(code, playerCalls);
    setGame(data.game);
    setTotals(data.totals);
    setShowCallsModal(false);
    showToastMessage(`Round ${data.game.rounds.length} calls locked! 📝 Now play the round.`);
  };

  // Step 1 edit: Edit calls on existing round
  const handleEditCalls = async (playerCalls) => {
    const data = await editCalls(code, editingRound.roundNumber, playerCalls);
    setGame(data.game);
    setTotals(data.totals);
    setEditingRound(null);
    setShowCallsModal(false);
    showToastMessage(`Round ${editingRound.roundNumber} calls updated! ✓`);
  };

  // Step 2: Submit tricks (new or edit)
  const handleSubmitTricks = async (playerTricks) => {
    const targetRound = editingRound || pendingRound;
    const data = await submitTricks(code, targetRound.roundNumber, playerTricks);
    setGame(data.game);
    setTotals(data.totals);
    setEditingRound(null);
    setShowTricksModal(false);

    if (data.game.status === 'completed') {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }

    showToastMessage(
      editingRound
        ? `Round ${targetRound.roundNumber} tricks updated! ✓`
        : `Round ${targetRound.roundNumber} complete! ✓`
    );
  };

  // Handle edit button click from ScoreTable
  const handleEditRound = (round) => {
    setEditingRound(round);
    if (round.status === 'calling') {
      // Round in progress — edit calls
      setShowCallsModal(true);
    } else {
      // Round completed — edit tricks
      setShowTricksModal(true);
    }
  };

  const closeModals = () => {
    setShowCallsModal(false);
    setShowTricksModal(false);
    setEditingRound(null);
  };

  const copyGameCode = () => {
    navigator.clipboard.writeText(code.toUpperCase()).then(() => {
      showToastMessage('Game code copied! 📋');
    });
  };

  const showToastMessage = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  // Find winner
  const getWinner = () => {
    if (!totals || Object.keys(totals).length === 0) return null;
    return Object.entries(totals).reduce(
      (best, [name, score]) => (score > best.score ? { name, score } : best),
      { name: '', score: -Infinity }
    );
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <span>Loading game...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-state animate-fade-in">
          <div className="error-state-icon">😕</div>
          <p className="error-state-text">{error}</p>
          <p className="error-state-sub">
            Check the game code and make sure the server is running.
          </p>
          <button className="btn btn-secondary" onClick={() => navigate('/')} id="go-home-btn">
            ← Go Home
          </button>
        </div>
      </div>
    );
  }

  const winner = getWinner();

  return (
    <div className="container">
      <div className="scorecard-page animate-fade-in-up">
        {/* Header */}
        <div className="scorecard-header">
          <div className="scorecard-title-section">
            <a href="/" className="back-link" style={{ marginBottom: '8px' }}>
              ← Back
            </a>
            <h1 className="heading-lg">
              {isComplete ? '🏆 ' : '🃏 '}
              <span className="text-gradient">Scorecard</span>
            </h1>
            <div
              className="game-code-display"
              onClick={copyGameCode}
              title="Click to copy game code"
              id="copy-code-btn"
            >
              <code>{code.toUpperCase()}</code>
              <span className="copy-icon">📋</span>
            </div>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
              Round {roundsPlayed} of {totalRoundsCount} completed
              {isComplete ? ' · Game Over' : pendingRound ? ' · Round in progress' : ' · Ready'}
            </p>
          </div>

          <div className="scorecard-actions">
            {/* Show "Make Calls" when no pending round and game not complete */}
            {!isComplete && !pendingRound && totalRoundsStarted < totalRoundsCount && (
              <button
                className="btn btn-primary"
                onClick={() => { setEditingRound(null); setShowCallsModal(true); }}
                id="make-calls-btn"
              >
                📝 Make Calls (R{totalRoundsStarted + 1})
                <span className="btn-subtitle">🎯 {nextStarterName} starts</span>
              </button>
            )}

            {/* Show "Enter Tricks" when there's a pending round */}
            {!isComplete && pendingRound && (
              <button
                className="btn btn-primary enter-tricks-btn"
                onClick={() => { setEditingRound(null); setShowTricksModal(true); }}
                id="enter-tricks-btn"
              >
                🏆 Enter Tricks (R{pendingRound.roundNumber})
              </button>
            )}

            {/* Show "Start Rematch" when game is completed */}
            {isComplete && (
              <button
                className="btn btn-primary animate-scale-in"
                onClick={handleRematch}
                disabled={rematchLoading}
                id="rematch-btn"
              >
                {rematchLoading ? '⏳ Starting...' : '🔁 Play Again'}
                <span className="btn-subtitle">🎯 {nextGameFirstPlayerName} starts first</span>
              </button>
            )}
          </div>
        </div>

        {/* Pending Round Banner */}
        {pendingRound && (
          <div className="pending-round-banner glass-card animate-scale-in">
            <div className="pending-round-icon">🎴</div>
            <div className="pending-round-info">
              <strong>Round {pendingRound.roundNumber} in progress</strong>
              <span>Calls are locked. Play the round, then enter tricks won.</span>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => { setEditingRound(null); setShowTricksModal(true); }}
            >
              Enter Tricks →
            </button>
          </div>
        )}

        {/* Winner Banner */}
        {isComplete && winner && (
          <div className="game-complete-banner glass-card animate-scale-in">
            <div className="winner-crown">🏆</div>
            <div className="winner-name">{winner.name} Wins!</div>
            <div className="winner-score">
              Final Score: {winner.score > 0 ? '+' : ''}
              {winner.score}
            </div>
            <div style={{ marginTop: '20px' }}>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleRematch}
                disabled={rematchLoading}
                id="banner-rematch-btn"
              >
                {rematchLoading ? '⏳ Starting New Game...' : '🔁 Start Rematch (Same Players)'}
                <span className="btn-subtitle">🎯 {nextGameFirstPlayerName} starts Round 1</span>
              </button>
            </div>
          </div>
        )}

        {/* Score Table */}
        <ScoreTable game={game} totals={totals} onEditRound={handleEditRound} />

        {/* Calls Modal — New or Edit */}
        {showCallsModal && (
          <CallsModal
            players={game.players}
            roundNumber={editingRound ? editingRound.roundNumber : totalRoundsStarted + 1}
            onSubmit={editingRound ? handleEditCalls : handleSubmitCalls}
            onClose={closeModals}
            initialCalls={editingRound?.scores}
          />
        )}

        {/* Tricks Modal — New or Edit */}
        {showTricksModal && (pendingRound || editingRound) && (
          <TricksModal
            players={game.players}
            roundNumber={(editingRound || pendingRound).roundNumber}
            roundScores={(editingRound || pendingRound).scores}
            onSubmit={handleSubmitTricks}
            onClose={closeModals}
            initialTricks={
              editingRound?.status === 'completed'
                ? editingRound.scores.map((s) => ({ playerName: s.playerName, tricks: s.tricks }))
                : null
            }
          />
        )}

        {/* Toast */}
        {toast && <div className="toast">{toast}</div>}

        {/* Confetti */}
        {showConfetti && (
          <div className="confetti-container">
            {confettiPieces.map((p) => (
              <div
                key={p.id}
                className="confetti-piece"
                style={{
                  left: `${p.left}%`,
                  backgroundColor: p.color,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.duration}s`,
                  transform: `rotate(${p.rotation}deg)`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Scorecard;
