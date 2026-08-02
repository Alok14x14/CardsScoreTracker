import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import CreateGame from './pages/CreateGame';
import Scorecard from './pages/Scorecard';
import Login from './pages/Login';
import Register from './pages/Register';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-bg" />
        <Header />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateGame />} />
            <Route path="/game/:code" element={<Scorecard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </main>
      </Router>
    </AuthProvider>
  );
}

export default App;
