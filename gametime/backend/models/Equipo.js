const mongoose = require('mongoose');

// Modelo de Equipo con referencia a liga
const equipoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  abbr: { type: String, required: true }, // abreviación obligatoria
  logo: String,
  roster: [{
    name: { type: String, required: true },
    age: { type: Number, default: 0 }, // Edad del jugador
    height: { type: String, default: '' }, // Estatura del jugador (ej: "1.85m")
    position: { type: String, default: '' }, // Posición del jugador
    image: { type: String, default: '' }, // URL de la imagen del jugador
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
  coach: {
    name: { type: String, default: '' },
    image: { type: String, default: '' }
  },
  league: { type: mongoose.Schema.Types.ObjectId, ref: 'Liga', required: true }
});

module.exports = mongoose.model('Equipo', equipoSchema);
