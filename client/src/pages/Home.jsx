import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRecentGames } from '../api';

const suitIcons = ['♠', '♥', '♦', '♣'];

function Home() {
  const navigate = useNavigate();
  const [gameCode, setGameCode] = useState('');
  const [recentGames, setRecentGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecentGames()
      .then((data) => {
        setRecentGames(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleJoin = (e) => {
    e.preventDefault();
    const code = gameCode.trim().toUpperCase();
    if (code.length === 6) {
      navigate(`/game/${code}`);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="container">
      {/* Hero Section */}
      <section className="hero animate-fade-in-up">
        <div className="hero-suits">
          {suitIcons.map((suit, i) => (
            <span key={i} className={i % 2 === 1 ? 'suit-red' : 'suit-black'}>{suit}</span>
          ))}
        </div>
        <h1 className="heading-xl">
          <span className="text-gradient">CallBreak</span>
          <br />
          Score Tracker
        </h1>
        <p className="hero-subtitle">
          Track your Callbreak scores in real-time. No more pen & paper — just
          create a game, share the code, and start playing!
        </p>

        <div className="hero-actions">
          <button
            className="btn btn-primary btn-lg"
            onClick={() => navigate('/create')}
            id="create-game-btn"
          >
            🃏 Create New Game
          </button>

          <span className="divider-text">or join an existing game</span>

          <form className="join-form" onSubmit={handleJoin}>
            <input
              type="text"
              className="input-field"
              placeholder="GAME CODE"
              maxLength={6}
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              id="join-game-input"
            />
            <button
              type="submit"
              className="btn btn-secondary"
              disabled={gameCode.trim().length !== 6}
              id="join-game-btn"
            >
              Join →
            </button>
          </form>
        </div>
      </section>

      {/* Recent Games */}
      {recentGames.length > 0 && (
        <section className="recent-games animate-fade-in-up stagger-2">
          <h2 className="section-title">
            <span>🕐</span> Recent Games
          </h2>
          <div className="games-grid">
            {recentGames.map((game, i) => (
              <div
                key={game._id}
                className={`glass-card game-card animate-fade-in-up stagger-${Math.min(i + 1, 5)}`}
                onClick={() => navigate(`/game/${game.gameCode}`)}
                id={`recent-game-${game.gameCode}`}
              >
                <div className="game-card-info">
                  <span className="game-card-code">{game.gameCode}</span>
                  <span className="game-card-players">
                    {game.players.join(' • ')}
                  </span>
                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {formatDate(game.createdAt)} · Round {game.rounds.length}/{game.totalRounds}
                  </span>
                </div>
                <span
                  className={`game-card-status ${
                    game.status === 'completed'
                      ? 'status-completed'
                      : 'status-in-progress'
                  }`}
                >
                  {game.status === 'completed' ? '✓ Done' : '● Live'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {!loading && recentGames.length === 0 && (
        <section className="recent-games animate-fade-in-up stagger-2">
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <div className="empty-state-icon">🎴</div>
            <p className="text-secondary" style={{ fontSize: '0.95rem' }}>
              No games yet. Create your first game to get started!
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

export default Home;
