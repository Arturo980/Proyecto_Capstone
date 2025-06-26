const express = require('express');
const router = express.Router();
const { getGames, createGame, updateGame, deleteGame, getWeekGames } = require('../controllers/gameController');

// Rutas de partidos
router.get('/', getGames);
router.get('/week', getWeekGames);
router.post('/', createGame);
router.put('/:id', updateGame);
router.delete('/:id', deleteGame);

module.exports = router;
