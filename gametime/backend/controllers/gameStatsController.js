const { GameStats, Partido, Equipo } = require('../models');

// GET /api/game-stats?gameId=ID&league=ID
const getGameStats = async (req, res) => {
  try {
    const { gameId, league } = req.query;
    let filter = {};
    
    if (gameId) filter.gameId = gameId;
    if (league) filter.league = league;
    
    const stats = await GameStats.find(filter)
      .populate('gameId', 'team1 team2 date partidoFinalizado')
      .populate('league', 'name');
    
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'No se pudieron obtener las estadísticas del partido', details: err.message });
  }
};

// POST /api/game-stats (crear o actualizar estadísticas de un partido)
const createOrUpdateGameStats = async (req, res) => {
  try {
    const { gameId, playerName, team, league, ...stats } = req.body;
    
    if (!gameId || !playerName || !team || !league) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // Verificar que el partido existe y está finalizado
    const game = await Partido.findById(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }
    
    if (!game.partidoFinalizado) {
      return res.status(400).json({ error: 'Solo se pueden agregar estadísticas a partidos finalizados' });
    }

    // Verificar que el jugador está citado para el partido
    const citados = (game.citados || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!citados.includes(playerName)) {
      return res.status(400).json({ error: 'El jugador debe estar citado para el partido' });
    }

    // Buscar si ya existen estadísticas para este jugador en este partido
    let gameStats = await GameStats.findOne({ gameId, playerName, team });
    
    if (gameStats) {
      // Actualizar estadísticas existentes
      Object.assign(gameStats, stats);
      await gameStats.save();
    } else {
      // Crear nuevas estadísticas
      gameStats = await GameStats.create({ 
        gameId, 
        playerName, 
        team, 
        league, 
        ...stats 
      });
    }

    res.json(gameStats);
  } catch (err) {
    res.status(400).json({ error: 'No se pudieron guardar las estadísticas', details: err.message });
  }
};

// GET /api/game-stats/player-averages?league=ID
const getPlayerAverages = async (req, res) => {
  try {
    const { league } = req.query;
    let matchFilter = {};
    if (league) matchFilter.league = league;

    // Agregar estadísticas para calcular promedios
    const averages = await GameStats.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: { playerName: '$playerName', team: '$team' },
          totalGames: { $sum: 1 },
          totalSets: { $sum: '$setsPlayed' },
          totalAces: { $sum: '$aces' },
          totalAssists: { $sum: '$assists' },
          totalAttacks: { $sum: '$attacks' },
          totalBlocks: { $sum: '$blocks' },
          totalDigs: { $sum: '$digs' },
          totalHittingErrors: { $sum: '$hittingErrors' },
          totalKills: { $sum: '$kills' },
          totalPoints: { $sum: '$points' }
        }
      },
      {
        $project: {
          playerName: '$_id.playerName',
          team: '$_id.team',
          totalGames: 1,
          totalSets: 1,
          acesPerSet: { 
            $cond: { 
              if: { $gt: ['$totalSets', 0] }, 
              then: { $divide: ['$totalAces', '$totalSets'] }, 
              else: 0 
            } 
          },
          assistsPerSet: { 
            $cond: { 
              if: { $gt: ['$totalSets', 0] }, 
              then: { $divide: ['$totalAssists', '$totalSets'] }, 
              else: 0 
            } 
          },
          attacksPerSet: { 
            $cond: { 
              if: { $gt: ['$totalSets', 0] }, 
              then: { $divide: ['$totalAttacks', '$totalSets'] }, 
              else: 0 
            } 
          },
          blocksPerSet: { 
            $cond: { 
              if: { $gt: ['$totalSets', 0] }, 
              then: { $divide: ['$totalBlocks', '$totalSets'] }, 
              else: 0 
            } 
          },
          digsPerSet: { 
            $cond: { 
              if: { $gt: ['$totalSets', 0] }, 
              then: { $divide: ['$totalDigs', '$totalSets'] }, 
              else: 0 
            } 
          },
          hittingErrorsPerSet: { 
            $cond: { 
              if: { $gt: ['$totalSets', 0] }, 
              then: { $divide: ['$totalHittingErrors', '$totalSets'] }, 
              else: 0 
            } 
          },
          killsPerSet: { 
            $cond: { 
              if: { $gt: ['$totalSets', 0] }, 
              then: { $divide: ['$totalKills', '$totalSets'] }, 
              else: 0 
            } 
          },
          pointsPerSet: { 
            $cond: { 
              if: { $gt: ['$totalSets', 0] }, 
              then: { $divide: ['$totalPoints', '$totalSets'] }, 
              else: 0 
            } 
          }
        }
      },
      { $sort: { playerName: 1 } }
    ]);

    res.json(averages);
  } catch (err) {
    res.status(500).json({ error: 'No se pudieron calcular los promedios', details: err.message });
  }
};

// DELETE /api/game-stats/:id
const deleteGameStats = async (req, res) => {
  try {
    const deleted = await GameStats.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Estadística no encontrada' });
    }
    res.json({ message: 'Estadística eliminada correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo eliminar la estadística', details: err.message });
  }
};

module.exports = {
  getGameStats,
  createOrUpdateGameStats,
  getPlayerAverages,
  deleteGameStats
};
