const express = require('express');
const router = express.Router();
const { createLeague, getLeagues, updateLeague, deleteLeague } = require('../controllers/leagueController');

// Rutas de ligas
router.post('/', createLeague);
router.get('/', getLeagues);
router.put('/:id', updateLeague);
router.delete('/:id', deleteLeague);

module.exports = router;
