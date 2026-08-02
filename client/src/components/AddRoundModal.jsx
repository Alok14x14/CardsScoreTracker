import { useState } from 'react';
import { createPortal } from 'react-dom';

const suitIcons = ['♠', '♥', '♦', '♣'];

function CallsModal({
  game,
  players: propsPlayers,
  roundNumber: propsRoundNumber,
  onSubmit,
  onClose,
  initialScores,
  initialCalls: propsInitialCalls,
}) {
  const players = propsPlayers || game?.players || [];
  const roundNumber = propsRoundNumber || (game?.rounds?.length || 0) + 1;
  const initialCalls = propsInitialCalls || initialScores;
  const isEditing = !!initialCalls;

  const [calls, setCalls] = useState(() =>
    players.map((name) => {
      const existing = initialCalls?.find((c) => c.playerName === name);
      return { playerName: name, call: existing && existing.call !== null ? String(existing.call) : '' };
    })
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateCall = (index, value) => {
    const updated = [...calls];
    updated[index] = { ...updated[index], call: value };
    setCalls(updated);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    for (const c of calls) {
      const call = Number(c.call);
      if (c.call === '' || call < 1 || call > 8 || !Number.isInteger(call)) {
        setError(`Call for ${c.playerName} must be 1-8.`);
        return;
      }
    }

    setLoading(true);
    try {
      await onSubmit(
        calls.map((c) => ({
          playerName: c.playerName,
          call: Number(c.call),
        }))
      );
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit calls.');
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-card modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-step-badge">
          {isEditing ? 'Edit Calls' : 'Step 1 of 2'}
        </div>
        <h2 className="heading-md modal-title">
          <span className="text-gradient">
            Round {roundNumber} — {isEditing ? 'Edit Calls' : 'Calls'}
          </span>
        </h2>
        <p className="modal-subtitle">
          {isEditing
            ? 'Update the calls for this round.'
            : 'Enter each player\'s call (bid) before playing.'}
        </p>

        <form onSubmit={handleSubmit}>
          {calls.map((c, i) => (
            <div key={i} className="modal-player-row modal-player-row-simple">
              <div className="modal-player-name">
                <span className={`suit-icon ${i % 2 === 1 ? 'suit-red' : 'suit-black'}`}>{suitIcons[i % 4]}</span>
                {c.playerName}
              </div>
              <div className="input-group">
                <label>Call (1-8)</label>
                <input
                  type="number"
                  className="input-field"
                  min={1}
                  max={8}
                  placeholder="Call"
                  value={c.call}
                  onChange={(e) => updateCall(i, e.target.value)}
                  id={`call-input-${i}`}
                  autoFocus={i === 0}
                />
              </div>
            </div>
          ))}

          {error && (
            <p className="modal-error">⚠ {error}</p>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} id="calls-cancel-btn">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} id="calls-submit-btn">
              {loading ? '⏳ Saving...' : isEditing ? '✓ Update Calls' : '📝 Lock Calls'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

function TricksModal({
  game,
  round,
  players: propsPlayers,
  roundNumber: propsRoundNumber,
  roundScores: propsRoundScores,
  onSubmit,
  onClose,
  initialTricks: propsInitialTricks,
}) {
  const players = propsPlayers || game?.players || [];
  const activeRound = round || game?.rounds?.find((r) => r.status === 'calling') || game?.rounds?.[game?.rounds?.length - 1];
  const roundNumber = propsRoundNumber || activeRound?.roundNumber || (game?.rounds?.length || 1);
  const roundScores = propsRoundScores || activeRound?.scores || [];
  const initialTricks = propsInitialTricks || (activeRound?.status === 'completed' ? activeRound?.scores : null);
  const isEditing = !!initialTricks;

  const [tricks, setTricks] = useState(() =>
    players.map((name) => {
      const existing = initialTricks?.find((t) => t.playerName === name);
      return { playerName: name, tricks: existing && existing.tricks !== null ? String(existing.tricks) : '' };
    })
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateTricks = (index, value) => {
    const updated = [...tricks];
    updated[index] = { ...updated[index], tricks: value };
    setTricks(updated);
    setError('');
  };

  const getCall = (playerName) => {
    const entry = roundScores?.find((s) => s.playerName === playerName);
    return entry ? entry.call : '?';
  };

  const totalTricks = tricks.reduce((sum, t) => {
    const val = Number(t.tricks);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    for (const t of tricks) {
      const val = Number(t.tricks);
      if (t.tricks === '' || val < 0 || val > 13 || !Number.isInteger(val)) {
        setError(`Tricks for ${t.playerName} must be 0-13.`);
        return;
      }
    }

    if (totalTricks !== 13) {
      setError(`Total tricks must equal 13 (currently ${totalTricks}).`);
      return;
    }

    setLoading(true);
    try {
      await onSubmit(
        tricks.map((t) => ({
          playerName: t.playerName,
          tricks: Number(t.tricks),
        }))
      );
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit tricks.');
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-card modal" onClick={(e) => e.stopPropagation()}>
        <div className={`modal-step-badge step-2`}>
          {isEditing ? 'Edit Tricks' : 'Step 2 of 2'}
        </div>
        <h2 className="heading-md modal-title">
          <span className="text-gradient">
            Round {roundNumber} — {isEditing ? 'Edit Tricks' : 'Tricks Won'}
          </span>
        </h2>
        <p className="modal-subtitle">
          {isEditing
            ? 'Update the tricks won for this round.'
            : 'Round is Over! Enter how many tricks each player actually won.'}
        </p>

        <div className={`tricks-counter ${totalTricks === 13 ? 'tricks-valid' : totalTricks > 13 ? 'tricks-over' : ''}`}>
          <span className="tricks-counter-label">Total Tricks:</span>
          <span className="tricks-counter-value">{totalTricks}</span>
          <span className="tricks-counter-target">/ 13</span>
        </div>

        <form onSubmit={handleSubmit}>
          {tricks.map((t, i) => (
            <div key={i} className="modal-player-row modal-player-row-simple">
              <div className="modal-player-name">
                <span className={`suit-icon ${i % 2 === 1 ? 'suit-red' : 'suit-black'}`}>{suitIcons[i % 4]}</span>
                <span>{t.playerName}</span>
                <span className="player-call-badge">Called {getCall(t.playerName)}</span>
              </div>
              <div className="input-group">
                <label>Tricks won (0-13)</label>
                <input
                  type="number"
                  className="input-field"
                  min={0}
                  max={13}
                  placeholder="Tricks"
                  value={t.tricks}
                  onChange={(e) => updateTricks(i, e.target.value)}
                  id={`tricks-input-${i}`}
                  autoFocus={i === 0}
                />
              </div>
            </div>
          ))}

          {error && (
            <p className="modal-error">⚠ {error}</p>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} id="tricks-cancel-btn">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} id="tricks-submit-btn">
              {loading ? '⏳ Calculating...' : isEditing ? '✓ Update Tricks' : '🏆 Submit Tricks'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export { CallsModal, TricksModal };
