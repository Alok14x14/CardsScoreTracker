const mongoose = require('mongoose');

const playerScoreSchema = new mongoose.Schema({
  playerName: { type: String, required: true },
  call: { type: Number, required: true, min: 1, max: 8 },
  tricks: { type: Number, default: null, min: 0, max: 13 },
  roundScore: { type: Number, default: null },
});

const roundSchema = new mongoose.Schema({
  roundNumber: { type: Number, required: true },
  status: {
    type: String,
    enum: ['calling', 'completed'],
    default: 'calling',
  },
  scores: [playerScoreSchema],
});

const gameSchema = new mongoose.Schema(
  {
    gameCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      minlength: 6,
      maxlength: 6,
    },
    players: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => arr.length === 4,
        message: 'Exactly 4 players are required.',
      },
    },
    totalRounds: { type: Number, default: 5, min: 1, max: 20 },
    firstPlayerIndex: { type: Number, default: 0, min: 0, max: 3 },
    rounds: [roundSchema],
    status: {
      type: String,
      enum: ['in_progress', 'completed'],
      default: 'in_progress',
    },
  },
  { timestamps: true }
);

// Compute cumulative totals per player (only from completed rounds)
gameSchema.methods.getCumulativeTotals = function () {
  const totals = {};
  this.players.forEach((p) => (totals[p] = 0));

  this.rounds.forEach((round) => {
    if (round.status !== 'completed') return;
    round.scores.forEach((s) => {
      if (s.roundScore !== null) {
        totals[s.playerName] = +(totals[s.playerName] + s.roundScore).toFixed(1);
      }
    });
  });

  return totals;
};

module.exports = mongoose.model('Game', gameSchema);
