const mongoose = require('mongoose');

// Modelo de Noticia
const noticiaSchema = new mongoose.Schema({
  title: { type: String, required: true },
  summary: { type: String, required: true },
  content: { type: String, required: true },
  mainImage: { type: String, required: true }, // Imagen principal obligatoria
  images: [String], // Otras imágenes opcionales
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Noticia', noticiaSchema);
