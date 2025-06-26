const mongoose = require('mongoose');

// Modelo de Partido
const partidoSchema = new mongoose.Schema({
  league: { type: mongoose.Schema.Types.ObjectId, ref: 'Liga', required: true },
  team1: { type: String, required: true },
  team2: { type: String, required: true },
  team1_abbr: { type: String, required: true }, // abbr equipo 1
  team2_abbr: { type: String, required: true }, // abbr equipo 2
  date: { type: String, required: true }, // formato: yyyy-mm-dd
  time: { type: String, required: true }, // formato: hh:mm
  score1: { type: Number, default: null },
  score2: { type: Number, default: null },
  citados: { type: String, default: '' }, // citados (string, lista separada por coma)
  sets1: { type: Number, default: null }, // sets ganados equipo 1
  sets2: { type: Number, default: null }, // sets ganados equipo 2
  // Guarda el historial de sets: [{score1, score2}, ...]
  setsHistory: { type: Array, default: [] },
  partidoFinalizado: { type: Boolean, default: false }
});

module.exports = mongoose.model('Partido', partidoSchema);
