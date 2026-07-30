import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGame } from '../api';

const playerSuits = ['♠', '♥', '♦', '♣'];

function CreateGame() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState(['', '', '', '']);
  const [totalRounds, setTotalRounds] = useState(5);
  const [firstPlayerIndex, setFirstPlayerIndex] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updatePlayer = (index, value) => {
    const updated = [...players];
    updated[index] = value;
    setPlayers(updated);
  };

  // Get display name for player selector
  const getPlayerLabel = (index) => {
    const name = players[index]?.trim();
    return name || `Player ${index + 1}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate all names are filled
    const trimmed = players.map((p) => p.trim());
    if (trimmed.some((p) => p.length === 0)) {
      setError('All 4 player names are required.');
      return;
    }

    // Check for duplicates
    const unique = new Set(trimmed.map((p) => p.toLowerCase()));
    if (unique.size !== 4) {
      setError('All player names must be unique.');
      return;
    }

    if (totalRounds < 1 || totalRounds > 20) {
      setError('Rounds must be between 1 and 20.');
      return;
    }

    setLoading(true);
    try {
      const data = await createGame(trimmed, totalRounds, firstPlayerIndex);
      navigate(`/game/${data.game.gameCode}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create game. Is the server running?');
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="create-page">
        <a href="/" className="back-link animate-fade-in">
          ← Back to Home
        </a>

        <form
          className="glass-card create-form animate-fade-in-up"
          onSubmit={handleSubmit}
        >
          <h1 className="heading-lg create-form-title">
            <span className="text-gradient">New Game</span>
          </h1>

          <p className="text-secondary" style={{ marginBottom: '24px', fontSize: '0.9rem' }}>
            Enter the names of all 4 players to begin.
          </p>

          <div className="players-grid">
            {players.map((name, i) => (
              <div
                key={i}
                className={`input-group animate-fade-in-up stagger-${i + 1}`}
              >
                <label>
                  <span className={i % 2 === 1 ? 'suit-red' : 'suit-black'}>{playerSuits[i]}</span> Player {i + 1}
                </label>
                <div className="player-input-wrapper">
                  <input
                    type="text"
                    className="input-field"
                    placeholder={`Player ${i + 1} name`}
                    value={name}
                    onChange={(e) => updatePlayer(i, e.target.value)}
                    maxLength={20}
                    id={`player-name-${i + 1}`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="settings-row">
            <div className="input-group rounds-input animate-fade-in-up stagger-5">
              <label>🔄 Number of Rounds</label>
              <input
                type="number"
                className="input-field"
                min={1}
                max={20}
                value={totalRounds}
                onChange={(e) => setTotalRounds(Number(e.target.value))}
                id="total-rounds-input"
              />
            </div>

            <div className="input-group first-player-input animate-fade-in-up stagger-5">
              <label>🎯 Who starts first?</label>
              <div className="first-player-selector">
                {players.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`first-player-chip ${firstPlayerIndex === i ? 'active' : ''}`}
                    onClick={() => setFirstPlayerIndex(i)}
                    id={`first-player-${i}`}
                  >
                    <span className={`chip-suit ${i % 2 === 1 ? 'suit-red' : 'suit-black'}`}>{playerSuits[i]}</span>
                    <span className="chip-name">{getPlayerLabel(i)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <p
              style={{
                color: 'var(--accent-rose)',
                fontSize: '0.85rem',
                fontWeight: 500,
                marginBottom: '16px',
                animation: 'fadeIn 0.3s ease',
              }}
            >
              ⚠ {error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            id="start-game-btn"
          >
            {loading ? '⏳ Creating...' : '🚀 Start Game'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateGame;
