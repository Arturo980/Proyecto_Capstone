const { Equipo, Liga, AuditLog } = require('../models');
const { getUserEmailFromRequest } = require('../utils/auth');
const { sendToTrash } = require('./auditController');

// GET /api/teams?league=ID&abbr=ABBR - Lista equipos con filtros opcionales
const getTeams = async (req, res) => {
  try {
    const { league, abbr, teamId } = req.query;
    let filter = {};
    
    // Si se proporciona teamId (compatibilidad hacia atrás)
    if (teamId) {
      filter._id = teamId;
    }
    
    // Si se proporciona league, puede ser ID o código de liga
    if (league) {
      // Verificar si es un ObjectId válido
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(league);
      
      if (isValidObjectId) {
        // Es un ID válido, usar directamente
        filter.league = league;
      } else {
        // No es un ID, buscar liga por código
        const foundLeague = await Liga.findOne({ code: league.toUpperCase() });
        if (foundLeague) {
          filter.league = foundLeague._id;
        } else {
          // Si no se encuentra por código, intentar por nombre (compatibilidad hacia atrás)
          const foundLeagueByName = await Liga.findOne({ name: league });
          if (foundLeagueByName) {
            filter.league = foundLeagueByName._id;
          } else {
            // Liga no encontrada
            return res.json({ teams: [] });
          }
        }
      }
    }
    
    // Si se proporciona abbr
    if (abbr) {
      filter.abbr = abbr;
    }
    
    const equipos = await Equipo.find(filter).populate('league');
    res.json({ teams: equipos });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo obtener los equipos', details: err.message });
  }
};

// POST /api/teams - Crear equipo (requiere league)
const createTeam = async (req, res) => {
  try {
    const equipo = new Equipo(req.body);
    await equipo.save();
    res.status(201).json(equipo);
  } catch (err) {
    res.status(400).json({ error: 'No se pudo crear el equipo', details: err.message });
  }
};

// PUT /api/teams/:id - Editar equipo
const updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const equipo = await Equipo.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!equipo) return res.status(404).json({ error: 'Equipo no encontrado' });
    res.json(equipo);
  } catch (err) {
    res.status(400).json({ error: 'No se pudo actualizar el equipo', details: err.message });
  }
};

// DELETE /api/teams/:id - Eliminar equipo (enviar a papelera)
const deleteTeam = async (req, res) => {
  try {
    const equipo = await Equipo.findByIdAndDelete(req.params.id);
    if (!equipo) return res.status(404).json({ error: 'Equipo no encontrado' });
    
    // Enviar a papelera en lugar de crear AuditLog directamente
    await sendToTrash('team', equipo._id.toString(), equipo.toObject(), getUserEmailFromRequest(req));
    
    res.json({ message: 'Equipo enviado a papelera. Se eliminará permanentemente en 15 días.' });
  } catch (err) {
    res.status(400).json({ error: 'No se pudo eliminar el equipo', details: err.message });
  }
};

// GET /api/teams/:id - Obtener equipo específico por ID
const getTeamById = async (req, res) => {
  try {
    const { id } = req.params;
    const equipo = await Equipo.findById(id).populate('league');
    
    if (!equipo) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    
    res.json(equipo);
  } catch (err) {
    res.status(500).json({ error: 'No se pudo obtener el equipo', details: err.message });
  }
};

module.exports = {
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamById
};
