import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getRecentGames } from '../api';
import { useAuth } from '../context/AuthContext';

const suitIcons = ['♠', '♥', '♦', '♣'];

function Home() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [recentGames, setRecentGames] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      getRecentGames()
        .then((data) => {
          setRecentGames(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setRecentGames([]);
    }
  }, [isAuthenticated]);

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

  const handleCreateGameClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      navigate('/create');
    }
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
          Track your Callbreak scores in real-time. Create your game and keep score effortlessly.
        </p>

        <div className="hero-actions">
          <button
            className="btn btn-primary btn-lg"
            onClick={handleCreateGameClick}
            id="create-game-btn"
          >
            🃏 Create New Game
          </button>
        </div>
      </section>

      {/* Guest Sign-In Banner */}
      {!isAuthenticated && (
        <section className="guest-banner animate-fade-in-up stagger-1">
          <div className="glass-card guest-banner-card">
            <div className="guest-banner-info">
              <span className="guest-banner-icon">👑</span>
              <div>
                <h4>Sign In to Create & Track Games</h4>
                <p>Log in or sign up to create games, edit scores, and view your personal game history.</p>
              </div>
            </div>
            <div className="guest-banner-actions">
              <Link to="/register" className="btn btn-primary btn-sm">Create Account</Link>
              <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
            </div>
          </div>
        </section>
      )}

      {/* User's Recent Games Section (Only visible when authenticated) */}
      {isAuthenticated && (
        <section className="recent-games animate-fade-in-up stagger-2">
          <div className="section-header-row">
            <h2 className="section-title">
              <span>🕐</span> Your Recent Games
            </h2>
          </div>

          {loading ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <p className="text-secondary">Loading your games...</p>
            </div>
          ) : recentGames.length > 0 ? (
            <div className="games-grid">
              {recentGames.map((game, i) => (
                <div
                  key={game._id}
                  className={`glass-card game-card user-game-card animate-fade-in-up stagger-${Math.min(i + 1, 5)}`}
                  onClick={() => navigate(`/game/${game.gameCode}`)}
                  id={`recent-game-${game.gameCode}`}
                >
                  <div className="game-card-header">
                    <span className="user-badge" title="Created by you">
                      ⭐ Your Game
                    </span>
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {formatDate(game.createdAt)}
                    </span>
                  </div>
                  <div className="game-card-info" style={{ marginTop: '8px' }}>
                    <span className="game-card-players">
                      {game.players.join(' • ')}
                    </span>
                    <span className="text-muted" style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                      Round {game.rounds.length}/{game.totalRounds}
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
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-state-icon">🎴</div>
              <p className="text-secondary" style={{ fontSize: '0.95rem' }}>
                You haven't created any games yet. Start your first game!
              </p>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/create')}
                style={{ marginTop: '16px' }}
              >
                🃏 Create Game
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default Home;
