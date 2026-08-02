import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGame, createGame, submitCalls, submitTricks, editCalls } from '../api';
import { useAuth } from '../context/AuthContext';
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
  const { user } = useAuth();
  const [game, setGame] = useState(null);
  const [totals, setTotals] = useState({});
  const [loading, setLoading] = useState(true);
  const [rematchLoading, setRematchLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCallsModal, setShowCallsModal] = useState(false);
  const [showTricksModal, setShowTricksModal] = useState(false);
  const [editingRound, setEditingRound] = useState(null);
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

  const creatorId = game?.createdBy?._id || game?.createdBy;
  const userId = user?._id || user?.id;
  const isCreator = !!(creatorId && userId && creatorId.toString() === userId.toString());

  const pendingRound = game?.rounds?.find((r) => r.status === 'calling');
  const isComplete = game?.status === 'completed';
  const roundsPlayed = game?.rounds?.filter((r) => r.status === 'completed').length || 0;
  const totalRoundsCount = game?.totalRounds || 5;
  const totalRoundsStarted = game?.rounds?.length || 0;
  const firstPlayerIndex = game?.firstPlayerIndex ?? 0;

  const nextStarterIndex = (firstPlayerIndex + totalRoundsStarted) % 4;
  const nextStarterName = game?.players?.[nextStarterIndex] || '';

  const nextGameFirstPlayerIndex = (firstPlayerIndex + 1) % 4;
  const nextGameFirstPlayerName = game?.players?.[nextGameFirstPlayerIndex] || '';

  const handleRematch = async () => {
    if (!isCreator) return;
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

  const handleSubmitCalls = async (playerCalls) => {
    if (!isCreator) return;
    try {
      const data = await submitCalls(code, playerCalls);
      setGame(data.game);
      setTotals(data.totals);
      setShowCallsModal(false);
      showToastMessage(`Round ${data.game.rounds.length} calls locked! 📝`);
    } catch (err) {
      showToastMessage(err.response?.data?.error || 'Failed to submit calls.');
    }
  };

  const handleEditCalls = async (playerCalls) => {
    if (!isCreator) return;
    try {
      const data = await editCalls(code, editingRound.roundNumber, playerCalls);
      setGame(data.game);
      setTotals(data.totals);
      setEditingRound(null);
      setShowCallsModal(false);
      showToastMessage(`Round ${editingRound.roundNumber} calls updated! ✓`);
    } catch (err) {
      showToastMessage(err.response?.data?.error || 'Failed to edit calls.');
    }
  };

  const handleSubmitTricks = async (playerTricks) => {
    if (!isCreator) return;
    const targetRound = editingRound || pendingRound;
    try {
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
    } catch (err) {
      showToastMessage(err.response?.data?.error || 'Failed to submit tricks.');
    }
  };

  const handleEditRound = (round) => {
    if (!isCreator) return;
    setEditingRound(round);
    if (round.status === 'calling') {
      setShowCallsModal(true);
    } else {
      setShowTricksModal(true);
    }
  };

  const closeModals = () => {
    setShowCallsModal(false);
    setShowTricksModal(false);
    setEditingRound(null);
  };

  const showToastMessage = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

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
            <div className="game-creator-info">
              <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                Creator: {game?.createdBy?.name || game?.createdBy?.username || 'Unknown'}
              </span>
            </div>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
              Round {roundsPlayed} of {totalRoundsCount} completed
              {isComplete ? ' · Game Over' : pendingRound ? ' · Round in progress' : ' · Ready'}
            </p>
          </div>

          <div className="scorecard-actions">
            {isCreator ? (
              <>
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

                {/* Show "Edit Calls" and "Enter Tricks" when there's a pending round */}
                {!isComplete && pendingRound && (
                  <>
                    <button
                      className="btn btn-secondary"
                      onClick={() => { setEditingRound(pendingRound); setShowCallsModal(true); }}
                      id="edit-calls-btn"
                    >
                      ✏️ Edit Calls (R{pendingRound.roundNumber})
                    </button>
                    <button
                      className="btn btn-primary enter-tricks-btn"
                      onClick={() => { setEditingRound(null); setShowTricksModal(true); }}
                      id="enter-tricks-btn"
                    >
                      🏆 Enter Tricks (R{pendingRound.roundNumber})
                    </button>
                  </>
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
              </>
            ) : (
              <div className="read-only-badge">
                🔒 Read-Only (Only the game creator can edit scores)
              </div>
            )}
          </div>
        </div>

        {/* Pending Round Banner */}
        {pendingRound && (
          <div className="pending-round-banner glass-card animate-scale-in">
            <div className="pending-round-icon">🎴</div>
            <div className="pending-round-info">
              <strong>Round {pendingRound.roundNumber} in progress</strong>
              <span>
                {isCreator
                  ? 'Calls are locked. Play the round, then enter tricks won.'
                  : 'Waiting for game creator to enter tricks.'}
              </span>
            </div>
            {isCreator && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setEditingRound(pendingRound); setShowCallsModal(true); }}
                  id="banner-edit-calls-btn"
                >
                  ✏️ Edit Calls
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => { setEditingRound(null); setShowTricksModal(true); }}
                  id="banner-enter-tricks-btn"
                >
                  Enter Tricks →
                </button>
              </div>
            )}
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
            {isCreator && (
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
            )}
          </div>
        )}

        {/* Score Table */}
        <ScoreTable
          game={game}
          totals={totals}
          onEditRound={isCreator ? handleEditRound : null}
          isCreator={isCreator}
        />

        {/* Modals for Creator only */}
        {isCreator && showCallsModal && (
          <CallsModal
            game={game}
            players={game.players}
            roundNumber={editingRound ? editingRound.roundNumber : totalRoundsStarted + 1}
            initialScores={editingRound ? editingRound.scores : null}
            initialCalls={editingRound ? editingRound.scores : null}
            onSubmit={editingRound ? handleEditCalls : handleSubmitCalls}
            onClose={closeModals}
          />
        )}

        {isCreator && showTricksModal && (
          <TricksModal
            game={game}
            players={game.players}
            round={editingRound || pendingRound}
            roundNumber={editingRound ? editingRound.roundNumber : pendingRound?.roundNumber}
            roundScores={(editingRound || pendingRound)?.scores}
            initialTricks={editingRound?.status === 'completed' ? editingRound.scores : null}
            onSubmit={handleSubmitTricks}
            onClose={closeModals}
          />
        )}

        {/* Toast */}
        {toast && <div className="toast animate-fade-in-up">{toast}</div>}

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
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.duration}s`,
                  width: `${p.size}px`,
                  height: `${p.size * 1.5}px`,
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
