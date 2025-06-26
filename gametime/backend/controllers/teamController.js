const { Equipo, AuditLog } = require('../models');
const { getUserEmailFromRequest } = require('../utils/auth');
const { sendToTrash } = require('./auditController');

// GET /api/teams?league=ID - Lista equipos de una liga
const getTeams = async (req, res) => {
  try {
    const { league } = req.query;
    let equipos = [];
    if (league) {
      equipos = await Equipo.find({ league }).populate('league');
    } else {
      equipos = await Equipo.find().populate('league');
    }
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

module.exports = {
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam
};
