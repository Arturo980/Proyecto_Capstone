const { GameStats, Partido, Equipo } = require('../models');
const mongoose = require('mongoose');

// GET /api/game-stats?gameId=ID&league=ID
const getGameStats = async (req, res) => {
  try {
    const { gameId, league } = req.query;
    console.log('🔍 getGameStats: Received request with params:', { gameId, league });
    
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
    
    console.log('🔍 getGameStats: Using filter:', filter);
    
    const stats = await GameStats.find(filter)
      .populate('gameId', 'team1 team2 date partidoFinalizado')
      .populate('league', 'name');
    
    console.log('✅ getGameStats: Found', stats.length, 'stats');
    console.log('✅ getGameStats: First few stats:', stats.slice(0, 2));
    
    res.json(stats);
  } catch (err) {
    console.error('❌ getGameStats: Error:', err);
    res.status(500).json({ error: 'No se pudieron obtener las estadísticas del partido', details: err.message });
  }
};

// POST /api/game-stats (crear o actualizar estadísticas de un partido)
const createOrUpdateGameStats = async (req, res) => {
  try {
    const { gameId, playerName, team, league, ...stats } = req.body;
    console.log('📝 createOrUpdateGameStats: Received data:', { gameId, playerName, team, league, statsKeys: Object.keys(stats) });
    
    if (!gameId || !playerName || !team || !league) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // Convertir a ObjectId si es válido
    const gameObjectId = mongoose.Types.ObjectId.isValid(gameId) ? new mongoose.Types.ObjectId(gameId) : gameId;
    const leagueObjectId = mongoose.Types.ObjectId.isValid(league) ? new mongoose.Types.ObjectId(league) : league;

    console.log('📝 createOrUpdateGameStats: Converted IDs:', { gameObjectId, leagueObjectId });

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
    
    console.log('📝 createOrUpdateGameStats: Existing stats found:', !!gameStats);
    
    if (gameStats) {
      // Actualizar estadísticas existentes
      Object.assign(gameStats, stats);
      await gameStats.save();
      console.log('📝 createOrUpdateGameStats: Updated existing stats');
    } else {
      // Crear nuevas estadísticas
      gameStats = await GameStats.create({ 
        gameId: gameObjectId, 
        playerName, 
        team, 
        league: leagueObjectId, 
        ...stats 
      });
      console.log('📝 createOrUpdateGameStats: Created new stats');
    }

    res.json(gameStats);
  } catch (err) {
    console.error('❌ createOrUpdateGameStats: Error:', err);
    res.status(400).json({ error: 'No se pudieron guardar las estadísticas', details: err.message });
  }
};

// PUT /api/game-stats/:id
const updateGameStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { gameId, playerName, team, league, ...stats } = req.body;
    console.log('🔄 updateGameStats: Received data:', { id, gameId, playerName, team, league, statsKeys: Object.keys(stats) });
    
    if (!gameId || !playerName || !team || !league) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // Convertir a ObjectId si es válido
    const gameObjectId = mongoose.Types.ObjectId.isValid(gameId) ? new mongoose.Types.ObjectId(gameId) : gameId;
    const leagueObjectId = mongoose.Types.ObjectId.isValid(league) ? new mongoose.Types.ObjectId(league) : league;

    console.log('🔄 updateGameStats: Converted IDs:', { gameObjectId, leagueObjectId });

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

    console.log('🔄 updateGameStats: Updated stats successfully');
    res.json(updatedStats);
  } catch (err) {
    console.error('❌ updateGameStats: Error:', err);
    res.status(400).json({ error: 'No se pudieron actualizar las estadísticas', details: err.message });
  }
};

// GET /api/game-stats/player-averages?league=ID
const getPlayerAverages = async (req, res) => {
  try {
    const { league } = req.query;
    console.log('📊 getPlayerAverages: Received request with league:', league);
    
    let matchFilter = {};
    if (league) {
      if (mongoose.Types.ObjectId.isValid(league)) {
        matchFilter.league = new mongoose.Types.ObjectId(league);
      } else {
        matchFilter.league = league;
      }
    }

    console.log('📊 getPlayerAverages: Using filter:', matchFilter);

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

    console.log('📊 getPlayerAverages: Found', averages.length, 'player averages');
    res.json(averages);
  } catch (err) {
    console.error('❌ getPlayerAverages: Error:', err);
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
