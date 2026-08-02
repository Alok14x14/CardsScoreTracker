const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const authRouter = require('./routes/auth');
const gamesRouter = require('./routes/games');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection caching for serverless compatibility
let cachedDb = null;
async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI environment variable is missing.');
  }
  cachedDb = await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');
  return cachedDb;
}

app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    res.status(500).json({ error: 'Database connection failure', details: err.message });
  }
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/games', gamesRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = app;
module.exports.connectToDatabase = connectToDatabase;
