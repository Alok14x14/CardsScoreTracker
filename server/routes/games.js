const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const crypto = require('crypto');
const { authenticate } = require('../middleware/auth');

// Generate a unique 6-character game code
function generateGameCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

// Calculate score for a single player in a round
function calculateRoundScore(call, tricks) {
  if (tricks >= call) {
    // Met or exceeded call: +call + 0.1 per extra trick
    return +(call + (tricks - call) * 0.1).toFixed(1);
  } else {
    // Failed to meet call: -call
    return -call;
  }
}

// Helper to verify game ownership/creator access
function verifyCreatorAccess(game, user, res) {
  if (!game.createdBy || game.createdBy.toString() !== user._id.toString()) {
    res.status(403).json({ error: 'Only the creator of this game can edit scores.' });
    return false;
  }
  return true;
}

// ─── POST /api/games — Create a new game (Requires Authentication) ───────────
router.post('/', authenticate, async (req, res) => {
  try {
    const { players, totalRounds, firstPlayerIndex } = req.body;

    if (!players || players.length !== 4) {
      return res.status(400).json({ error: 'Exactly 4 player names are required.' });
    }

    // Check for duplicate player names
    const uniqueNames = new Set(players.map((p) => p.trim().toLowerCase()));
    if (uniqueNames.size !== 4) {
      return res.status(400).json({ error: 'All player names must be unique.' });
    }

    const trimmedPlayers = players.map((p) => p.trim());

    // Generate a unique game code
    let gameCode;
    let exists = true;
    while (exists) {
      gameCode = generateGameCode();
      exists = await Game.findOne({ gameCode });
    }

    const parsedFirstPlayerIndex = Number(firstPlayerIndex);
    const validFirstPlayerIndex = !isNaN(parsedFirstPlayerIndex) ? ((parsedFirstPlayerIndex % 4) + 4) % 4 : 0;

    const game = new Game({
      gameCode,
      createdBy: req.user._id,
      players: trimmedPlayers,
      totalRounds: totalRounds || 5,
      firstPlayerIndex: validFirstPlayerIndex,
      rounds: [],
      status: 'in_progress',
    });

    await game.save();

    res.status(201).json({
      game,
      totals: game.getCumulativeTotals(),
    });
  } catch (err) {
    console.error('Error creating game:', err);
    res.status(500).json({ error: 'Failed to create game.' });
  }
});

// ─── GET /api/games — List user's recently created games only ─────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const games = await Game.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('createdBy', 'username name')
      .select('gameCode createdBy players status totalRounds firstPlayerIndex rounds createdAt');

    const gamesWithTotals = games.map((g) => ({
      ...g.toObject(),
      totals: g.getCumulativeTotals(),
    }));

    res.json(gamesWithTotals);
  } catch (err) {
    console.error('Error fetching user games:', err);
    res.status(500).json({ error: 'Failed to fetch games.' });
  }
});

// ─── GET /api/games/:code — Get game by code ────────────────────────────────
router.get('/:code', async (req, res) => {
  try {
    const game = await Game.findOne({ gameCode: req.params.code.toUpperCase() }).populate('createdBy', 'username name');

    if (!game) {
      return res.status(404).json({ error: 'Game not found.' });
    }

    res.json({
      game,
      totals: game.getCumulativeTotals(),
    });
  } catch (err) {
    console.error('Error fetching game:', err);
    res.status(500).json({ error: 'Failed to fetch game.' });
  }
});

// ─── POST /api/games/:code/rounds — Step 1: Submit calls (Creator Only) ────
router.post('/:code/rounds', authenticate, async (req, res) => {
  try {
    const game = await Game.findOne({ gameCode: req.params.code.toUpperCase() });

    if (!game) {
      return res.status(404).json({ error: 'Game not found.' });
    }

    if (!verifyCreatorAccess(game, req.user, res)) return;

    if (game.status === 'completed') {
      return res.status(400).json({ error: 'Game is already completed.' });
    }

    // Check if there's a round still waiting for tricks
    const lastRound = game.rounds[game.rounds.length - 1];
    if (lastRound && lastRound.status === 'calling') {
      return res.status(400).json({
        error: 'Please enter tricks for the current round before starting a new one.',
      });
    }

    if (game.rounds.length >= game.totalRounds) {
      return res.status(400).json({ error: 'All rounds have been played.' });
    }

    const { playerCalls } = req.body;

    if (!playerCalls || playerCalls.length !== 4) {
      return res.status(400).json({ error: 'Calls for all 4 players are required.' });
    }

    const roundNumber = game.rounds.length + 1;

    const scores = playerCalls.map((pc) => {
      const call = Number(pc.call);

      if (call < 1 || call > 8) {
        throw new Error(`Invalid call value for ${pc.playerName}: must be 1-8`);
      }

      return {
        playerName: pc.playerName,
        call,
        tricks: null,
        roundScore: null,
      };
    });

    game.rounds.push({ roundNumber, status: 'calling', scores });
    await game.save();

    res.status(201).json({
      game,
      totals: game.getCumulativeTotals(),
    });
  } catch (err) {
    console.error('Error adding round calls:', err);
    res.status(400).json({ error: err.message || 'Failed to add round.' });
  }
});

// ─── PUT /api/games/:code/rounds/:roundNumber/tricks — Step 2: Submit tricks (Creator Only) ─
router.put('/:code/rounds/:roundNumber/tricks', authenticate, async (req, res) => {
  try {
    const game = await Game.findOne({ gameCode: req.params.code.toUpperCase() });

    if (!game) {
      return res.status(404).json({ error: 'Game not found.' });
    }

    if (!verifyCreatorAccess(game, req.user, res)) return;

    const roundNumber = Number(req.params.roundNumber);
    const round = game.rounds.find((r) => r.roundNumber === roundNumber);

    if (!round) {
      return res.status(404).json({ error: 'Round not found.' });
    }

    const { playerTricks } = req.body;

    if (!playerTricks || playerTricks.length !== 4) {
      return res.status(400).json({ error: 'Tricks for all 4 players are required.' });
    }

    // Validate total tricks sum to 13
    const totalTricks = playerTricks.reduce((sum, pt) => sum + Number(pt.tricks), 0);
    if (totalTricks !== 13) {
      return res.status(400).json({
        error: `Total tricks must equal 13 (currently ${totalTricks}).`,
      });
    }

    // Update tricks and calculate scores
    playerTricks.forEach((pt) => {
      const tricks = Number(pt.tricks);

      if (tricks < 0 || tricks > 13) {
        throw new Error(`Invalid tricks for ${pt.playerName}: must be 0-13`);
      }

      const scoreEntry = round.scores.find((s) => s.playerName === pt.playerName);
      if (!scoreEntry) {
        throw new Error(`Player ${pt.playerName} not found in this round.`);
      }

      scoreEntry.tricks = tricks;
      scoreEntry.roundScore = calculateRoundScore(scoreEntry.call, tricks);
    });

    round.status = 'completed';

    // Auto-complete game if all rounds are completed
    const completedRounds = game.rounds.filter((r) => r.status === 'completed').length;
    if (completedRounds >= game.totalRounds) {
      game.status = 'completed';
    }

    await game.save();

    res.json({
      game,
      totals: game.getCumulativeTotals(),
    });
  } catch (err) {
    console.error('Error adding tricks:', err);
    res.status(400).json({ error: err.message || 'Failed to add tricks.' });
  }
});

// ─── PUT /api/games/:code/rounds/:roundNumber/calls — Edit calls (Creator Only) ────────────
router.put('/:code/rounds/:roundNumber/calls', authenticate, async (req, res) => {
  try {
    const game = await Game.findOne({ gameCode: req.params.code.toUpperCase() });

    if (!game) {
      return res.status(404).json({ error: 'Game not found.' });
    }

    if (!verifyCreatorAccess(game, req.user, res)) return;

    const roundNumber = Number(req.params.roundNumber);
    const round = game.rounds.find((r) => r.roundNumber === roundNumber);

    if (!round) {
      return res.status(404).json({ error: 'Round not found.' });
    }

    if (round.status === 'completed') {
      return res.status(400).json({ error: 'Cannot edit calls after tricks have been entered. Edit tricks instead.' });
    }

    const { playerCalls } = req.body;

    if (!playerCalls || playerCalls.length !== 4) {
      return res.status(400).json({ error: 'Calls for all 4 players are required.' });
    }

    playerCalls.forEach((pc) => {
      const call = Number(pc.call);

      if (call < 1 || call > 8) {
        throw new Error(`Invalid call value for ${pc.playerName}: must be 1-8`);
      }

      const scoreEntry = round.scores.find((s) => s.playerName === pc.playerName);
      if (!scoreEntry) {
        throw new Error(`Player ${pc.playerName} not found in this round.`);
      }

      scoreEntry.call = call;
    });

    await game.save();

    res.json({
      game,
      totals: game.getCumulativeTotals(),
    });
  } catch (err) {
    console.error('Error editing calls:', err);
    res.status(400).json({ error: err.message || 'Failed to edit calls.' });
  }
});

module.exports = router;
