const express = require('express');
const router = express.Router();
const { getAuditLog, restoreEntity, permanentDelete } = require('../controllers/auditController');

// Rutas de auditoría
router.get('/audit-log', getAuditLog);
router.post('/restore/:entity/:id', restoreEntity);
router.delete('/permanent/:entity/:id', permanentDelete);

module.exports = router;
