const mongoose = require('mongoose');

// Modelo de auditoría
const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true }, // 'delete', 'restore', etc.
  entity: { type: String, required: true }, // 'team', 'league', 'game', 'image'
  entityId: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed }, // Datos previos a la eliminación
  timestamp: { type: Date, default: Date.now },
  user: { type: String }, // correo del usuario que hizo la acción
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
