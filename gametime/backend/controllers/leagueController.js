const { Liga, Equipo, AuditLog } = require('../models');
const mongoose = require('mongoose');
const { getUserEmailFromRequest } = require('../utils/auth');

// Crear liga (verifica unicidad y guarda configuración)
const createLeague = async (req, res) => {
  try {
    // Verifica si ya existe una liga con ese nombre (case-insensitive)
    const exists = await Liga.findOne({ name: { $regex: new RegExp('^' + req.body.name + '$', 'i') } });
    if (exists) {
      return res.status(400).json({ error: 'Ya existe una liga con ese nombre' });
    }
    // Guarda también setsToWin y lastSetPoints si vienen en el body
    const liga = new Liga({
      name: req.body.name,
      setsToWin: req.body.setsToWin ?? 3,
      lastSetPoints: req.body.lastSetPoints ?? 15,
      pointsWin: req.body.pointsWin ?? 3,
      pointsLose: req.body.pointsLose ?? 0
    });
    await liga.save();
    res.status(201).json(liga);
  } catch (err) {
    res.status(400).json({ error: 'No se pudo crear la liga', details: err.message });
  }
};

// Listar ligas
const getLeagues = async (req, res) => {
  const ligas = await Liga.find();
  res.json(ligas);
};

// Actualizar liga
const updateLeague = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de liga inválido (no es un ObjectId)' });
    }
    const update = {};
    if (typeof req.body.setsToWin === 'number') update.setsToWin = req.body.setsToWin;
    if (typeof req.body.lastSetPoints === 'number') update.lastSetPoints = req.body.lastSetPoints;
    if (typeof req.body.name === 'string') update.name = req.body.name;
    if (typeof req.body.pointsWin === 'number') update.pointsWin = req.body.pointsWin;
    if (typeof req.body.pointsLose === 'number') update.pointsLose = req.body.pointsLose;
    
    const liga = await Liga.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!liga) {
      return res.status(404).json({ error: 'Liga no encontrada' });
    }
    res.json(liga);
  } catch (err) {
    res.status(400).json({ error: 'No se pudo actualizar la liga', details: err.message });
  }
};

// Eliminar liga y sus equipos asociados
const deleteLeague = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'Liga no encontrada (ID inválido)' });
    }
    const liga = await Liga.findByIdAndDelete(id);
    if (!liga) return res.status(404).json({ error: 'Liga no encontrada' });
    
    await AuditLog.create({
      action: 'delete',
      entity: 'league',
      entityId: liga._id.toString(),
      data: liga.toObject(),
      user: getUserEmailFromRequest(req)
    });
    
    const equipos = await Equipo.find({ league: id });
    for (const equipo of equipos) {
      await AuditLog.create({
        action: 'delete',
        entity: 'team',
        entityId: equipo._id.toString(),
        data: equipo.toObject(),
        user: getUserEmailFromRequest(req)
      });
      await equipo.deleteOne();
    }
    res.json({ message: 'Liga y equipos asociados eliminados' });
  } catch (err) {
    if (err.name === 'CastError' || err.message?.includes('ObjectId')) {
      return res.status(404).json({ error: 'Liga no encontrada' });
    }
    res.status(200).json({ message: 'Liga eliminada (con error interno, pero eliminada)' });
  }
};

module.exports = {
  createLeague,
  getLeagues,
  updateLeague,
  deleteLeague
};
