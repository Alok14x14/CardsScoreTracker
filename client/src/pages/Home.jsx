import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getRecentGames } from '../api';
import { useAuth } from '../context/AuthContext';

const suitIcons = ['♠', '♥', '♦', '♣'];

function Home() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [gameCode, setGameCode] = useState('');
  const [recentGames, setRecentGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabFilter, setTabFilter] = useState('all'); // 'all' | 'my'

  const fetchGames = useCallback(() => {
    setLoading(true);
    const userOnly = tabFilter === 'my';
    getRecentGames(userOnly)
      .then((data) => {
        setRecentGames(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tabFilter]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  // When user logs in or out, update tab filter accordingly
  useEffect(() => {
    if (isAuthenticated) {
      setTabFilter('my');
    } else {
      setTabFilter('all');
    }
  }, [isAuthenticated]);

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

  const isUserGame = (game) => {
    if (!user) return false;
    if (game.createdBy && (game.createdBy._id === user._id || game.createdBy === user._id)) {
      return true;
    }
    const uName = (user.name || '').toLowerCase();
    const uUsername = (user.username || '').toLowerCase();
    return game.players.some((p) => {
      const pl = p.toLowerCase();
      return pl === uName || pl === uUsername;
    });
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

      {/* Guest Sign-In Banner */}
      {!isAuthenticated && (
        <section className="guest-banner animate-fade-in-up stagger-1">
          <div className="glass-card guest-banner-card">
            <div className="guest-banner-info">
              <span className="guest-banner-icon">👑</span>
              <div>
                <h4>Save Your Game History</h4>
                <p>Create an account to track all your played games and access your personal stats anytime.</p>
              </div>
            </div>
            <div className="guest-banner-actions">
              <Link to="/register" className="btn btn-primary btn-sm">Create Account</Link>
              <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
            </div>
          </div>
        </section>
      )}

      {/* Recent Games Section */}
      <section className="recent-games animate-fade-in-up stagger-2">
        <div className="section-header-row">
          <h2 className="section-title">
            <span>🕐</span> {tabFilter === 'my' ? 'My Recently Played Games' : 'Recent Games'}
          </h2>

          {isAuthenticated && (
            <div className="tab-filters">
              <button
                className={`tab-btn ${tabFilter === 'my' ? 'active' : ''}`}
                onClick={() => setTabFilter('my')}
                id="tab-my-games"
              >
                🎮 My Games
              </button>
              <button
                className={`tab-btn ${tabFilter === 'all' ? 'active' : ''}`}
                onClick={() => setTabFilter('all')}
                id="tab-all-games"
              >
                🌐 All Games
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <p className="text-secondary">Loading games...</p>
          </div>
        ) : recentGames.length > 0 ? (
          <div className="games-grid">
            {recentGames.map((game, i) => {
              const belongsToUser = isUserGame(game);
              return (
                <div
                  key={game._id}
                  className={`glass-card game-card ${belongsToUser ? 'user-game-card' : ''} animate-fade-in-up stagger-${Math.min(i + 1, 5)}`}
                  onClick={() => navigate(`/game/${game.gameCode}`)}
                  id={`recent-game-${game.gameCode}`}
                >
                  <div className="game-card-header">
                    <span className="game-card-code">{game.gameCode}</span>
                    {belongsToUser && (
                      <span className="user-badge" title="You created or played in this game">
                        ⭐ Your Game
                      </span>
                    )}
                  </div>
                  <div className="game-card-info">
                    <span className="game-card-players">
                      {game.players.map((p, idx) => {
                        const isMe = user && (p.toLowerCase() === (user.name || '').toLowerCase() || p.toLowerCase() === (user.username || '').toLowerCase());
                        return (
                          <span key={idx} className={isMe ? 'player-highlight' : ''}>
                            {p}{idx < game.players.length - 1 ? ' • ' : ''}
                          </span>
                        );
                      })}
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
                    {game.status === 'completed' ? '✓ Completed' : '● Live'}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <div className="empty-state-icon">🎴</div>
            <p className="text-secondary" style={{ fontSize: '0.95rem' }}>
              {tabFilter === 'my'
                ? "You haven't played or created any games yet. Start a new game!"
                : "No recent games found. Create a game to get started!"}
            </p>
            {tabFilter === 'my' && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/create')}
                style={{ marginTop: '16px' }}
              >
                🃏 Create Game
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default Home;
