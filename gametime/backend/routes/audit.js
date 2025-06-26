const express = require('express');
const router = express.Router();
const { getAuditLog, restoreEntity } = require('../controllers/auditController');

// Rutas de auditoría
router.get('/audit-log', getAuditLog);
router.post('/restore/:entity/:id', restoreEntity);

module.exports = router;
