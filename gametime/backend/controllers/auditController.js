const { AuditLog, Equipo, Liga, Partido, MatchImage } = require('../models');
const { getUserEmailFromRequest } = require('../utils/auth');

// Listar SOLO acciones de eliminación (delete) de cualquier usuario y entidad
const getAuditLog = async (req, res) => {
  // Devuelve solo logs de acción 'delete', ordenados por fecha descendente
  const logs = await AuditLog.find({ action: 'delete' }).sort({ timestamp: -1 }).limit(200);
  res.json({ logs });
};

// Restaurar entidad eliminada (solo admin)
const restoreEntity = async (req, res) => {
  const { entity, id } = req.params;
  const log = await AuditLog.findOne({ entity, entityId: id, action: 'delete' }).sort({ timestamp: -1 });
  if (!log) return res.status(404).json({ error: 'No hay datos para restaurar' });

  let restored;
  if (entity === 'team') {
    restored = await Equipo.create(log.data);
  } else if (entity === 'league') {
    restored = await Liga.create(log.data);
  } else if (entity === 'game') {
    restored = await Partido.create(log.data);
  } else if (entity === 'image') {
    restored = await MatchImage.create(log.data);
  } else {
    return res.status(400).json({ error: 'Entidad no soportada' });
  }
  
  await AuditLog.create({
    action: 'restore',
    entity,
    entityId: id,
    data: log.data,
    user: getUserEmailFromRequest(req)
  });
  
  res.json({ message: 'Restaurado', restored });
};

module.exports = {
  getAuditLog,
  restoreEntity
};
