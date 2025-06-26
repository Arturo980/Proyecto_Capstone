const { Partido, Equipo, Liga, AuditLog } = require('../models');
const mongoose = require('mongoose');
const { getUserEmailFromRequest } = require('../utils/auth');
const { sendToTrash } = require('./auditController');

// GET /api/games?league=ID
const getGames = async (req, res) => {
  try {
    const { league, finished } = req.query;
    let query = {};
    if (league) query.league = league;
    // Si finished=true, solo partidos finalizados
    if (finished === 'true') query.partidoFinalizado = true;
    const games = await Partido.find(query).sort({ date: 1, time: 1 });
    res.json({ games });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo obtener los partidos', details: err.message });
  }
};

// POST /api/games
const createGame = async (req, res) => {
  try {
    // Busca las abreviaciones de los equipos
    const equipo1 = await Equipo.findOne({ name: req.body.team1, league: req.body.league });
    const equipo2 = await Equipo.findOne({ name: req.body.team2, league: req.body.league });
    const partido = new Partido({
      ...req.body,
      team1_abbr: equipo1?.abbr || req.body.team1,
      team2_abbr: equipo2?.abbr || req.body.team2
    });
    await partido.save();
    
    // Emitir evento de socket (se pasa el io desde las rutas)
    if (req.io) {
      req.io.emit('game_created', partido);
    }
    
    res.status(201).json(partido);
  } catch (err) {
    res.status(400).json({ error: 'No se pudo crear el partido', details: err.message });
  }
};

// PUT /api/games/:id
const updateGame = async (req, res) => {
  try {
    const { id } = req.params;
    const update = { ...req.body };
    
    // Si se cambia el equipo, actualiza la abreviación
    if (update.team1 || update.team2) {
      const partido = await Partido.findById(id);
      const equipo1 = await Equipo.findOne({ name: update.team1 || partido.team1, league: update.league || partido.league });
      const equipo2 = await Equipo.findOne({ name: update.team2 || partido.team2, league: update.league || partido.league });
      if (equipo1) update.team1_abbr = equipo1.abbr;
      if (equipo2) update.team2_abbr = equipo2.abbr;
    }
    
    // Si setsHistory viene como string (por error), intenta parsear
    if (typeof update.setsHistory === 'string') {
      try {
        update.setsHistory = JSON.parse(update.setsHistory);
      } catch {
        update.setsHistory = [];
      }
    }
    
    // Si setsHistory viene, calcula sets1, sets2 y partidoFinalizado
    if (Array.isArray(update.setsHistory)) {
      let sets1 = 0, sets2 = 0;
      update.setsHistory.forEach(s => {
        if (s.score1 > s.score2) sets1++;
        else if (s.score2 > s.score1) sets2++;
      });
      update.sets1 = sets1;
      update.sets2 = sets2;
      
      // Busca la liga para saber cuántos sets se necesitan para ganar
      let partidoFinalizado = false;
      const partido = await Partido.findById(id);
      let setsToWin = 3;
      if (partido && partido.league) {
        const liga = await Liga.findById(partido.league);
        if (liga && typeof liga.setsToWin === 'number') setsToWin = liga.setsToWin;
      }
      if (sets1 === setsToWin || sets2 === setsToWin) {
        partidoFinalizado = true;
      }
      update.partidoFinalizado = partidoFinalizado;
    }
    
    // Si partidoFinalizado viene explícitamente en el body, respétalo
    if (typeof req.body.partidoFinalizado === 'boolean') {
      update.partidoFinalizado = req.body.partidoFinalizado;
    }
    
    const partido = await Partido.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!partido) return res.status(404).json({ error: 'Partido no encontrado' });

    // Emitir eventos de socket según el tipo de actualización
    if (req.io) {
      if (
        Object.keys(req.body).length === 2 &&
        req.body.hasOwnProperty('score1') &&
        req.body.hasOwnProperty('score2')
      ) {
        req.io.emit('score_update', { gameId: id, score1: req.body.score1, score2: req.body.score2, partidoFinalizado: partido.partidoFinalizado });
      } else if (update.setsHistory) {
        req.io.emit('sets_history_update', {
          gameId: id,
          setsHistory: partido.setsHistory,
          sets1: partido.sets1,
          sets2: partido.sets2,
          score1: partido.score1,
          score2: partido.score2,
          partidoFinalizado: partido.partidoFinalizado
        });
      } else {
        req.io.emit('game_updated', partido);
      }
    }
    
    res.json(partido);
  } catch (err) {
    res.status(400).json({ error: 'No se pudo actualizar el partido', details: err.message });
  }
};

// DELETE /api/games/:id - Eliminar partido (enviar a papelera)
const deleteGame = async (req, res) => {
  try {
    const partido = await Partido.findByIdAndDelete(req.params.id);
    if (!partido) return res.status(404).json({ error: 'Partido no encontrado' });
    
    if (req.io) {
      req.io.emit('game_deleted', { _id: partido._id });
    }
    
    // Enviar a papelera en lugar de crear AuditLog directamente
    await sendToTrash('game', partido._id.toString(), partido.toObject(), getUserEmailFromRequest(req));
    
    res.json({ message: 'Partido enviado a papelera. Se eliminará permanentemente en 15 días.' });
  } catch (err) {
    res.status(400).json({ error: 'No se pudo eliminar el partido', details: err.message });
  }
};

// GET /api/games/week
const getWeekGames = async (req, res) => {
  try {
    const { league } = req.query;
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const query = {
      date: { $gte: startOfWeek.toISOString().slice(0, 10), $lt: endOfWeek.toISOString().slice(0, 10) }
    };
    if (league) query.league = league;

    console.log('Rango de semana:', startOfWeek.toISOString().slice(0, 10), '-', endOfWeek.toISOString().slice(0, 10));
    console.log('Query:', query);

    const partidos = await Partido.find(query).populate('league');
    console.log('Partidos encontrados:', partidos.map(p => ({
      date: p.date,
      time: p.time,
      team1: p.team1,
      team2: p.team2,
      league: p.league?.name
    })));

    const equipos = await Equipo.find();
    const getTeamData = (teamName) => {
      const eq = equipos.find(e => e.name === teamName);
      return {
        abbr: eq?.name || teamName,
        logo: eq?.logo || ''
      };
    };
    
    const result = partidos.map(match => ({
      home_team_abbr: getTeamData(match.team1).abbr,
      home_team_logo: getTeamData(match.team1).logo,
      away_team_abbr: getTeamData(match.team2).abbr,
      away_team_logo: getTeamData(match.team2).logo,
      date: `${match.date}T${match.time}`,
      league_name: match.league?.name || '',
      league_id: match.league?._id?.toString() || ''
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'No se pudo obtener los partidos de la semana', details: err.message });
  }
};

module.exports = {
  getGames,
  createGame,
  updateGame,
  deleteGame,
  getWeekGames
};
