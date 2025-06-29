const { AuditLog, Equipo, Liga, Partido, MatchImage, Noticia } = require('../models');
const { getUserEmailFromRequest } = require('../utils/auth');

// Función para limpiar elementos eliminados hace más de 15 días
const cleanupExpiredTrashItems = async () => {
  try {
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    
    // Buscar elementos que deben ser eliminados permanentemente
    const expiredItems = await AuditLog.find({
      action: 'delete',
      isInTrash: true,
      isPermanentlyDeleted: false,
      scheduledDeletion: { $lte: new Date() }
    });

    for (const item of expiredItems) {
      // Marcar como eliminado permanentemente
      await AuditLog.findByIdAndUpdate(item._id, {
        isPermanentlyDeleted: true,
        action: 'permanent_delete'
      });
      
      // Crear registro de eliminación permanente
      await AuditLog.create({
        action: 'permanent_delete',
        entity: item.entity,
        entityId: item.entityId,
        data: { originalData: item.data, reason: 'auto_cleanup_15_days' },
        user: 'system',
        isPermanentlyDeleted: true
      });
    }
    
  } catch (error) {
    console.error('Error en limpieza automática:', error);
  }
};

// Listar elementos en papelera (SOLO elementos delete que no han sido eliminados permanentemente)
const getAuditLog = async (req, res) => {
  try {
    // Ejecutar limpieza automática cada vez que se consulta
    await cleanupExpiredTrashItems();
    
    // Devuelve solo logs de acción 'delete' que están en papelera, ordenados por fecha descendente
    const logs = await AuditLog.find({ 
      action: 'delete', 
      isInTrash: true,
      isPermanentlyDeleted: false 
    }).sort({ timestamp: -1 }).limit(200);
    
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener logs de auditoría' });
  }
};

// Función auxiliar para enviar elemento a papelera
const sendToTrash = async (entity, entityId, data, userEmail) => {
  const scheduledDeletion = new Date();
  scheduledDeletion.setDate(scheduledDeletion.getDate() + 15); // 15 días desde ahora
  
  await AuditLog.create({
    action: 'delete',
    entity,
    entityId,
    data,
    user: userEmail,
    isInTrash: true,
    deletedAt: new Date(),
    scheduledDeletion
  });
};

// Restaurar entidad eliminada (solo admin)
const restoreEntity = async (req, res) => {
  try {
    const { entity, id } = req.params;
    
    const log = await AuditLog.findOne({ 
      entity, 
      entityId: id, 
      action: 'delete',
      isInTrash: true,
      isPermanentlyDeleted: false 
    }).sort({ timestamp: -1 });
    
    if (!log) {
      return res.status(404).json({ error: 'No hay datos para restaurar' });
    }

    let restored;
    if (entity === 'team') {
      restored = await Equipo.create(log.data);
    } else if (entity === 'league') {
      restored = await Liga.create(log.data);
    } else if (entity === 'game') {
      restored = await Partido.create(log.data);
    } else if (entity === 'image') {
      restored = await MatchImage.create(log.data);
    } else if (entity === 'news') {
      restored = await Noticia.create(log.data);
    } else {
      return res.status(400).json({ error: 'Entidad no soportada' });
    }
    
    // Marcar como restaurado (sacar de papelera)
    await AuditLog.findByIdAndUpdate(log._id, {
      isInTrash: false,
      isPermanentlyDeleted: false
    });
    
    // Crear registro de restauración
    await AuditLog.create({
      action: 'restore',
      entity,
      entityId: id,
      data: log.data,
      user: getUserEmailFromRequest(req)
    });
    
    res.json({ message: 'Restaurado exitosamente', restored });
  } catch (error) {
    console.error(`❌ Error al restaurar ${req.params.entity}:${req.params.id}:`, error);
    res.status(500).json({ error: 'Error al restaurar entidad' });
  }
};

// Eliminar permanentemente (solo admin)
const permanentDelete = async (req, res) => {
  try {
    const { entity, id } = req.params;
    
    const log = await AuditLog.findOne({ 
      entity, 
      entityId: id, 
      action: 'delete',
      isInTrash: true,
      isPermanentlyDeleted: false 
    }).sort({ timestamp: -1 });
    
    if (!log) {
      return res.status(404).json({ error: 'No hay datos para eliminar' });
    }
    
    // Marcar como eliminado permanentemente
    await AuditLog.findByIdAndUpdate(log._id, {
      isPermanentlyDeleted: true,
      action: 'permanent_delete'
    });
    
    // Crear registro de eliminación permanente
    await AuditLog.create({
      action: 'permanent_delete',
      entity,
      entityId: id,
      data: { originalData: log.data, reason: 'manual_admin_action' },
      user: getUserEmailFromRequest(req),
      isPermanentlyDeleted: true
    });
    
    res.json({ message: 'Eliminado permanentemente' });
  } catch (error) {
    console.error(`❌ Error al eliminar permanentemente ${req.params.entity}:${req.params.id}:`, error);
    res.status(500).json({ error: 'Error al eliminar permanentemente' });
  }
};

module.exports = {
  getAuditLog,
  restoreEntity,
  permanentDelete,
  sendToTrash,
  cleanupExpiredTrashItems
};
