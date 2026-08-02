import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loginCredential, setLoginCredential] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!loginCredential.trim() || !password) {
      setError('Please enter your username/email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(loginCredential.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="auth-page">
        <Link to="/" className="back-link animate-fade-in">
          ← Back to Home
        </Link>

        <form
          className="glass-card auth-form animate-fade-in-up"
          onSubmit={handleSubmit}
        >
          <h1 className="heading-lg auth-form-title">
            <span className="text-gradient">Welcome Back</span>
          </h1>

          <p className="text-secondary" style={{ marginBottom: '24px', fontSize: '0.9rem', textAlign: 'center' }}>
            Sign in to track your scores and access your recent games.
          </p>

          <div className="input-group">
            <label htmlFor="login-credential">Username or Email</label>
            <input
              id="login-credential"
              type="text"
              className="input-field"
              placeholder="e.g. ace_player or player@example.com"
              value={loginCredential}
              onChange={(e) => setLoginCredential(e.target.value)}
              required
            />
          </div>

          <div className="input-group" style={{ marginTop: '16px' }}>
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="auth-error-text">
              ⚠ {error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ marginTop: '24px', width: '100%' }}
            id="login-submit-btn"
          >
            {loading ? '⏳ Signing in...' : '🔓 Sign In'}
          </button>

          <p className="auth-footer-text">
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Create one now
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
