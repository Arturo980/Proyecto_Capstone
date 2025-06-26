const { PlayerStats } = require('../models');

// GET /api/player-stats?league=ID
const getPlayerStats = async (req, res) => {
  try {
    const { league } = req.query;
    let filter = {};
    if (league) filter.league = league;
    // Populate league name for frontend display (optional)
    const stats = await PlayerStats.find(filter).populate('league', 'name');
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'No se pudieron obtener las estadísticas', details: err.message });
  }
};

// POST /api/player-stats (crear o actualizar stats de un jugador)
const createOrUpdatePlayerStats = async (req, res) => {
  try {
    const { playerName, team, league, ...stats } = req.body;
    if (!playerName || !team || !league) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    // Busca si ya existe stats para este jugador/equipo/liga
    let playerStats = await PlayerStats.findOne({ playerName, team, league });
    if (playerStats) {
      Object.assign(playerStats, stats);
      await playerStats.save();
    } else {
      playerStats = await PlayerStats.create({ playerName, team, league, ...stats });
    }
    res.json(playerStats);
  } catch (err) {
    res.status(400).json({ error: 'No se pudieron guardar las estadísticas', details: err.message });
  }
};

// PUT /api/player-stats (actualizar múltiples stats)
const updateMultiplePlayerStats = async (req, res) => {
  try {
    const statsArray = Array.isArray(req.body) ? req.body : [];
    const updatedStats = [];
    for (const stat of statsArray) {
      const { playerName, team, league, ...rest } = stat;
      if (!playerName || !team || !league) continue;
      let playerStats = await PlayerStats.findOne({ playerName, team, league });
      if (playerStats) {
        Object.assign(playerStats, rest);
        await playerStats.save();
      } else {
        playerStats = await PlayerStats.create({ playerName, team, league, ...rest });
      }
      updatedStats.push(playerStats);
    }
    res.json(updatedStats);
  } catch (err) {
    res.status(400).json({ error: 'No se pudieron actualizar las estadísticas', details: err.message });
  }
};

// DELETE /api/player-stats/:id (eliminar estadísticas de un jugador)
const deletePlayerStats = async (req, res) => {
  try {
    const deleted = await PlayerStats.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Estadística no encontrada' });
    }
    res.json({ message: 'Estadística eliminada' });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo eliminar la estadística', details: err.message });
  }
};

module.exports = {
  getPlayerStats,
  createOrUpdatePlayerStats,
  updateMultiplePlayerStats,
  deletePlayerStats
};
