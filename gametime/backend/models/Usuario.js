const mongoose = require('mongoose');

// Esquema de Usuario actualizado con campo 'esAdmin' y reset password
const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  correo: { type: String, required: true, unique: true },
  contraseña: { type: String, required: true },
  tipoCuenta: { type: String, enum: ['match-manager', 'content-editor', 'public'], default: 'public' },
  aprobado: { type: Boolean, default: false },
  esAdmin: { type: Boolean, default: false }, // Campo para admin
  resetPasswordToken: { type: String }, // Token para reset de contraseña
  resetPasswordExpires: { type: Date }, // Fecha de expiración del token
});

module.exports = mongoose.model('Usuario', usuarioSchema);
