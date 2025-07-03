const { GameStats, Partido, Equipo } = require('../models');
const mongoose = require('mongoose');

// GET /api/game-stats?gameId=ID&league=ID
const getGameStats = async (req, res) => {
  try {
    const { gameId, league } = req.query;
    
    let filter = {};
    
    // Convertir strings a ObjectIds si son válidos
    if (gameId) {
      if (mongoose.Types.ObjectId.isValid(gameId)) {
        filter.gameId = new mongoose.Types.ObjectId(gameId);
      } else {
        filter.gameId = gameId;
      }
    }
    
    if (league) {
      if (mongoose.Types.ObjectId.isValid(league)) {
        filter.league = new mongoose.Types.ObjectId(league);
      } else {
        filter.league = league;
      }
    }
    
    const stats = await GameStats.find(filter)
      .populate('gameId', 'team1 team2 date partidoFinalizado')
      .populate('league', 'name');
    
    res.json(stats);
  } catch (err) {
    console.error('Error fetching game stats:', err);
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

    // Convertir a ObjectId si es válido
    const gameObjectId = mongoose.Types.ObjectId.isValid(gameId) ? new mongoose.Types.ObjectId(gameId) : gameId;
    const leagueObjectId = mongoose.Types.ObjectId.isValid(league) ? new mongoose.Types.ObjectId(league) : league;

    // Verificar que el partido existe y está finalizado
    const game = await Partido.findById(gameObjectId);
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
    let gameStats = await GameStats.findOne({ 
      gameId: gameObjectId, 
      playerName, 
      team 
    });
    
    if (gameStats) {
      // Actualizar estadísticas existentes
      Object.assign(gameStats, stats);
      await gameStats.save();
    } else {
      // Crear nuevas estadísticas
      gameStats = await GameStats.create({ 
        gameId: gameObjectId, 
        playerName, 
        team, 
        league: leagueObjectId, 
        ...stats 
      });
    }

    res.json(gameStats);
  } catch (err) {
    console.error('Error saving game stats:', err);
    res.status(400).json({ error: 'No se pudieron guardar las estadísticas', details: err.message });
  }
};

// PUT /api/game-stats/:id
const updateGameStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { gameId, playerName, team, league, ...stats } = req.body;
    
    if (!gameId || !playerName || !team || !league) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // Convertir a ObjectId si es válido
    const gameObjectId = mongoose.Types.ObjectId.isValid(gameId) ? new mongoose.Types.ObjectId(gameId) : gameId;
    const leagueObjectId = mongoose.Types.ObjectId.isValid(league) ? new mongoose.Types.ObjectId(league) : league;

    // Verificar que el partido existe y está finalizado
    const game = await Partido.findById(gameObjectId);
    if (!game) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }
    
    if (!game.partidoFinalizado) {
      return res.status(400).json({ error: 'Solo se pueden actualizar estadísticas de partidos finalizados' });
    }

    // Verificar que el jugador está citado para el partido
    const citados = (game.citados || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!citados.includes(playerName)) {
      return res.status(400).json({ error: 'El jugador debe estar citado para el partido' });
    }

    // Actualizar las estadísticas
    const updatedStats = await GameStats.findByIdAndUpdate(
      id,
      { 
        gameId: gameObjectId, 
        playerName, 
        team, 
        league: leagueObjectId, 
        ...stats,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!updatedStats) {
      return res.status(404).json({ error: 'Estadística no encontrada' });
    }

    res.json(updatedStats);
  } catch (err) {
    console.error('Error updating game stats:', err);
    res.status(400).json({ error: 'No se pudieron actualizar las estadísticas', details: err.message });
  }
};

// GET /api/game-stats/player-averages?league=ID
const getPlayerAverages = async (req, res) => {
  try {
    const { league } = req.query;
    console.log('🔍 Getting player averages for league:', league);
    
    let matchFilter = {};
    if (league) {
      if (mongoose.Types.ObjectId.isValid(league)) {
        matchFilter.league = new mongoose.Types.ObjectId(league);
      } else {
        matchFilter.league = league;
      }
    }

    console.log('📋 Match filter:', matchFilter);

    // Agregar estadísticas para calcular totales y promedios
    const averages = await GameStats.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: { playerName: '$playerName', team: '$team' },
          totalGames: { $sum: 1 },
          totalSets: { $sum: '$setsPlayed' },
          
          // Totales acumulados de todas las estadísticas
          aces: { $sum: '$aces' },
          assists: { $sum: '$assists' },
          attacks: { $sum: '$attacks' },
          blocks: { $sum: '$blocks' },
          digs: { $sum: '$digs' },
          hittingErrors: { $sum: '$hittingErrors' },
          kills: { $sum: '$kills' },
          points: { $sum: '$points' },
          
          // Estadísticas extendidas
          attackErrors: { $sum: '$attackErrors' },
          blockErrors: { $sum: '$blockErrors' },
          blockTouches: { $sum: '$blockTouches' },
          serveErrors: { $sum: '$serveErrors' },
          serveAttempts: { $sum: '$serveAttempts' },
          setErrors: { $sum: '$setErrors' },
          setAttempts: { $sum: '$setAttempts' },
          receptionSuccessful: { $sum: '$receptionSuccessful' },
          receptionErrors: { $sum: '$receptionErrors' },
          receptionAttempts: { $sum: '$receptionAttempts' },
          digErrors: { $sum: '$digErrors' }
        }
      },
      {
        $project: {
          playerName: '$_id.playerName',
          team: '$_id.team',
          totalGames: 1,
          totalSets: 1,
          
          // Totales (para las nuevas tablas)
          aces: 1,
          assists: 1,
          attacks: 1,
          blocks: 1,
          digs: 1,
          hittingErrors: 1,
          kills: 1,
          points: 1,
          attackErrors: 1,
          blockErrors: 1,
          blockTouches: 1,
          serveErrors: 1,
          serveAttempts: 1,
          setErrors: 1,
          setAttempts: 1,
          receptionSuccessful: 1,
          receptionErrors: 1,
          receptionAttempts: 1,
          digErrors: 1,
          
          // Promedios por set (para compatibilidad)
          acesPerSet: { 
            $cond: { 
              if: { $gt: ['$totalSets', 0] }, 
              then: { $divide: ['$aces', '$totalSets'] }, 
              else: 0 
            } 
          },
          assistsPerSet: { 
            $cond: { 
              if: { $gt: ['$totalSets', 0] }, 
              then: { $divide: ['$assists', '$totalSets'] }, 
              else: 0 
            } 
          },
          attacksPerSet: { 
            $cond: { 
              if: { $gt: ['$totalSets', 0] }, 
              then: { $divide: ['$attacks', '$totalSets'] }, 
              else: 0 
            } 
          },
          blocksPerSet: { 
            $cond: { 
              if: { $gt: ['$totalSets', 0] }, 
              then: { $divide: ['$blocks', '$totalSets'] }, 
              else: 0 
            } 
          },
          digsPerSet: { 
            $cond: { 
              if: { $gt: ['$totalSets', 0] }, 
              then: { $divide: ['$digs', '$totalSets'] }, 
              else: 0 
            } 
          },
          hittingErrorsPerSet: { 
            $cond: { 
              if: { $gt: ['$totalSets', 0] }, 
              then: { $divide: ['$hittingErrors', '$totalSets'] }, 
              else: 0 
            } 
          },
          killsPerSet: { 
            $cond: { 
              if: { $gt: ['$totalSets', 0] }, 
              then: { $divide: ['$kills', '$totalSets'] }, 
              else: 0 
            } 
          },
          pointsPerSet: { 
            $cond: { 
              if: { $gt: ['$totalSets', 0] }, 
              then: { $divide: ['$points', '$totalSets'] }, 
              else: 0 
            } 
          }
        }
      },
      { $sort: { playerName: 1 } }
    ]);

    console.log('📊 Player averages result count:', averages.length);
    console.log('👤 Sample data:', averages.slice(0, 2));

    res.json(averages);
  } catch (err) {
    console.error('Error calculating player averages:', err);
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
  updateGameStats,
  getPlayerAverages,
  deleteGameStats
};
