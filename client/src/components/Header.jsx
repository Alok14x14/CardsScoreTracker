import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="app-header">
      <div className="container header-container">
        <Link to="/" className="logo">
          <span className="logo-icon">♠</span>
          <span>CallBreak Score Tracker</span>
        </Link>

        <nav className="header-nav">
          {isAuthenticated ? (
            <div className="user-menu">
              <div className="user-avatar-chip">
                <span className="user-avatar-icon">👑</span>
                <span className="user-avatar-name">{user.name || user.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
                title="Sign Out"
                id="logout-btn"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-secondary btn-sm" id="nav-login-btn">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm" id="nav-register-btn">
                Sign Up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
