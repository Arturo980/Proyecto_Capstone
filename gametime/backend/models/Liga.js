const mongoose = require('mongoose');

// Modelo de Liga (colección de ligas) - agrega unique y configuración de sets
const ligaSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true, uppercase: true }, // Código único para URLs
  setsToWin: { type: Number, default: 3 },      // Mejor de 5 por defecto (gana 3)
  lastSetPoints: { type: Number, default: 15 }, // Último set a 15 por defecto
  pointsWin: { type: Number, default: 3 },      // puntos por victoria
  pointsLose: { type: Number, default: 0 }      // puntos por derrota
});

module.exports = mongoose.model('Liga', ligaSchema);
