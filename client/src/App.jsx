import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CreateGame from './pages/CreateGame';
import Scorecard from './pages/Scorecard';
import './index.css';

function App() {
  return (
    <Router>
      <div className="app-bg" />
      <header className="app-header">
        <div className="container">
          <a href="/" className="logo">
            <span className="logo-icon">♠</span>
            <span>CallBreak Casino Tracker</span>
          </a>
        </div>
      </header>
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateGame />} />
          <Route path="/game/:code" element={<Scorecard />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
