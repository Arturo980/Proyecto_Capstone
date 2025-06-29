const express = require('express');
const router = express.Router();
const { isAdmin } = require('../utils/isAdmin');
const { createLeague, getLeagues, updateLeague, deleteLeague } = require('../controllers/leagueController');

// Rutas de ligas
router.post('/', createLeague);
router.get('/', getLeagues);
router.put('/:id', isAdmin, updateLeague); // Solo admin puede actualizar (incluye prioridad)
router.delete('/:id', isAdmin, deleteLeague);

module.exports = router;
