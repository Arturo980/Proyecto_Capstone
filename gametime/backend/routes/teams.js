const express = require('express');
const router = express.Router();
const { getTeams, createTeam, updateTeam, deleteTeam } = require('../controllers/teamController');

// Rutas de equipos
router.get('/', getTeams);
router.post('/', createTeam);
router.put('/:id', updateTeam);
router.delete('/:id', deleteTeam);

module.exports = router;
