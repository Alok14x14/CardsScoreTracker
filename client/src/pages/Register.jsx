import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !email.trim() || !password) {
      setError('Username, email, and password are required.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register(username.trim(), email.trim(), password, name.trim());
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
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
            <span className="text-gradient">Create Account</span>
          </h1>

          <p className="text-secondary" style={{ marginBottom: '24px', fontSize: '0.9rem', textAlign: 'center' }}>
            Join CallBreak Tracker to save your games and track stats.
          </p>

          <div className="input-group">
            <label htmlFor="reg-username">Username</label>
            <input
              id="reg-username"
              type="text"
              className="input-field"
              placeholder="e.g. card_king"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group" style={{ marginTop: '14px' }}>
            <label htmlFor="reg-email">Email Address</label>
            <input
              id="reg-email"
              type="email"
              className="input-field"
              placeholder="player@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group" style={{ marginTop: '14px' }}>
            <label htmlFor="reg-name">Display Name (Optional)</label>
            <input
              id="reg-name"
              type="text"
              className="input-field"
              placeholder="e.g. Royal Dealer"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="input-group" style={{ marginTop: '14px' }}>
            <label htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              type="password"
              className="input-field"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="input-group" style={{ marginTop: '14px' }}>
            <label htmlFor="reg-confirm-password">Confirm Password</label>
            <input
              id="reg-confirm-password"
              type="password"
              className="input-field"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            id="register-submit-btn"
          >
            {loading ? '⏳ Creating Account...' : '✨ Create Account'}
          </button>

          <p className="auth-footer-text">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;
