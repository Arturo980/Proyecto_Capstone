const express = require('express');
const router = express.Router();
const { 
  getPlayerStats, 
  createOrUpdatePlayerStats, 
  updateMultiplePlayerStats, 
  deletePlayerStats 
} = require('../controllers/statsController');

// Rutas de estadísticas de jugadores
router.get('/', getPlayerStats);
router.post('/', createOrUpdatePlayerStats);
router.put('/', updateMultiplePlayerStats);
router.delete('/:id', deletePlayerStats);

module.exports = router;
