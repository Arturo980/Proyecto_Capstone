const mongoose = require('mongoose');

// Modelo para estadísticas específicas de un partido
const gameStatsSchema = new mongoose.Schema({
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partido', required: true },
  playerName: { type: String, required: true },
  team: { type: String, required: true },
  league: { type: mongoose.Schema.Types.ObjectId, ref: 'Liga', required: true },
  setsPlayed: { type: Number, required: true, min: 1 },
  
  // Estadísticas totales del partido (no promedios)
  aces: { type: Number, default: 0 },
  assists: { type: Number, default: 0 },
  attacks: { type: Number, default: 0 },
  blocks: { type: Number, default: 0 },
  digs: { type: Number, default: 0 },
  hittingErrors: { type: Number, default: 0 },
  kills: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  
  // Timestamp para control
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Índice compuesto para evitar duplicados
gameStatsSchema.index({ gameId: 1, playerName: 1, team: 1 }, { unique: true });

// Middleware para actualizar updatedAt
gameStatsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('GameStats', gameStatsSchema);
