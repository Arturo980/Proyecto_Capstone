const mongoose = require('mongoose');

// Modelo de imagen (solo URL y alt)
const matchImageSchema = new mongoose.Schema({
  partido: { type: mongoose.Schema.Types.ObjectId, ref: 'Partido', required: true },
  url: { type: String, required: true },
  alt: { type: String, default: '' }
});

module.exports = mongoose.model('MatchImage', matchImageSchema);
