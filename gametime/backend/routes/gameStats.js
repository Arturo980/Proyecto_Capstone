const express = require('express');
const router = express.Router();
const gameStatsController = require('../controllers/gameStatsController');

// GET /api/game-stats - Obtener estadísticas de partidos
router.get('/', gameStatsController.getGameStats);

// GET /api/game-stats/player-averages - Obtener promedios de jugadores
router.get('/player-averages', gameStatsController.getPlayerAverages);

// POST /api/game-stats - Crear o actualizar estadísticas de un partido
router.post('/', gameStatsController.createOrUpdateGameStats);

// PUT /api/game-stats/:id - Actualizar estadísticas específicas
router.put('/:id', gameStatsController.updateGameStats);

// DELETE /api/game-stats/:id - Eliminar estadísticas específicas
router.delete('/:id', gameStatsController.deleteGameStats);

module.exports = router;
