const mongoose = require('mongoose');

// Modelo de estadísticas individuales por jugador
const playerStatsSchema = new mongoose.Schema({
  playerName: { type: String, required: true },
  team: { type: String, required: true },
  league: { type: mongoose.Schema.Types.ObjectId, ref: 'Liga', required: true },
  acesPerSet: { type: Number, default: 0 },
  assistsPerSet: { type: Number, default: 0 },
  attacksPerSet: { type: Number, default: 0 },
  blocksPerSet: { type: Number, default: 0 },
  digsPerSet: { type: Number, default: 0 },
  hittingPercentage: { type: Number, default: 0 },
  killsPerSet: { type: Number, default: 0 },
  pointsPerSet: { type: Number, default: 0 }
});

module.exports = mongoose.model('PlayerStats', playerStatsSchema);
