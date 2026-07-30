import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Game API calls
export const createGame = (players, totalRounds, firstPlayerIndex) =>
  api.post('/games', { players, totalRounds, firstPlayerIndex }).then((res) => res.data);

export const getGame = (code) =>
  api.get(`/games/${code}`).then((res) => res.data);

export const getRecentGames = () =>
  api.get('/games').then((res) => res.data);

// Step 1: Submit calls to start a round
export const submitCalls = (code, playerCalls) =>
  api.post(`/games/${code}/rounds`, { playerCalls }).then((res) => res.data);

// Step 2: Submit tricks after playing
export const submitTricks = (code, roundNumber, playerTricks) =>
  api.put(`/games/${code}/rounds/${roundNumber}/tricks`, { playerTricks }).then((res) => res.data);

// Edit calls on an in-progress round
export const editCalls = (code, roundNumber, playerCalls) =>
  api.put(`/games/${code}/rounds/${roundNumber}/calls`, { playerCalls }).then((res) => res.data);

export default api;
