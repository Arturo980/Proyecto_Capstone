const mongoose = require('mongoose');

// Modelo de auditoría con sistema de papelera
const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true }, // 'delete', 'restore', 'permanent_delete', etc.
  entity: { type: String, required: true }, // 'team', 'league', 'game', 'image'
  entityId: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed }, // Datos previos a la eliminación
  timestamp: { type: Date, default: Date.now },
  user: { type: String }, // correo del usuario que hizo la acción
  // Nuevos campos para papelera
  isInTrash: { type: Boolean, default: false }, // Si está en papelera
  scheduledDeletion: { type: Date }, // Fecha programada para eliminación definitiva
  deletedAt: { type: Date }, // Fecha cuando se envió a papelera
  isPermanentlyDeleted: { type: Boolean, default: false }, // Si fue eliminado permanentemente
});

// Índice para optimizar consultas de limpieza automática
auditLogSchema.index({ scheduledDeletion: 1, isPermanentlyDeleted: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
