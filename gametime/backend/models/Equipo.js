const mongoose = require('mongoose');

// Modelo de Equipo con referencia a liga
const equipoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  abbr: { type: String, required: true }, // abreviación obligatoria
  logo: String,
  roster: [{
    name: { type: String, required: true },
    stats: {
      acesPerSet: { type: Number, default: 0 },
      assistsPerSet: { type: Number, default: 0 },
      attacksPerSet: { type: Number, default: 0 },
      blocksPerSet: { type: Number, default: 0 },
      digsPerSet: { type: Number, default: 0 },
      hittingPercentage: { type: Number, default: 0 },
      killsPerSet: { type: Number, default: 0 },
      pointsPerSet: { type: Number, default: 0 }
    }
  }],
  staff: [String],
  league: { type: mongoose.Schema.Types.ObjectId, ref: 'Liga', required: true }
});

module.exports = mongoose.model('Equipo', equipoSchema);
