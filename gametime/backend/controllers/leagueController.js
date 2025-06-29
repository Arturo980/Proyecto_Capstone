const { Liga, Equipo, AuditLog } = require('../models');
const mongoose = require('mongoose');
const { getUserEmailFromRequest } = require('../utils/auth');

// Función para generar código único basado en el nombre
const generateUniqueCode = async (name) => {
  // Crear código base eliminando espacios, acentos y caracteres especiales
  let baseCode = name
    .toUpperCase()
    .replace(/[ÁÀÄÂ]/g, 'A')
    .replace(/[ÉÈËÊ]/g, 'E')
    .replace(/[ÍÌÏÎ]/g, 'I')
    .replace(/[ÓÒÖÔ]/g, 'O')
    .replace(/[ÚÙÜÛ]/g, 'U')
    .replace(/Ñ/g, 'N')
    .replace(/[^A-Z0-9]/g, '') // Solo letras y números
    .substring(0, 8); // Máximo 8 caracteres

  // Si es muy corto, usar las primeras letras de cada palabra
  if (baseCode.length < 3) {
    const words = name.split(/\s+/);
    baseCode = words.map(word => word.charAt(0).toUpperCase()).join('').substring(0, 6);
  }

  // Verificar si ya existe
  let code = baseCode;
  let counter = 1;
  
  while (await Liga.findOne({ code })) {
    code = `${baseCode}${counter}`;
    counter++;
  }
  
  return code;
};

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
      code: await generateUniqueCode(req.body.name), // Generar código único
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

// Listar ligas ordenadas por prioridad (menor primero)
const getLeagues = async (req, res) => {
  try {
    const ligas = await Liga.find().sort({ priority: 1, name: 1 });
    // Migrar ligas que no tengan código único
    let needsUpdate = false;
    for (const liga of ligas) {
      if (!liga.code) {
        liga.code = await generateUniqueCode(liga.name);
        await liga.save();
        needsUpdate = true;
      }
    }
    // Si se actualizaron ligas, volver a consultar
    const finalLigas = needsUpdate ? await Liga.find().sort({ priority: 1, name: 1 }) : ligas;
    res.json(finalLigas);
  } catch (err) {
    res.status(500).json({ error: 'No se pudo obtener las ligas', details: err.message });
  }
};

// Actualizar liga (incluye prioridad, solo admin)
const updateLeague = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de liga inválido (no es un ObjectId)' });
    }
    // Solo admin puede cambiar prioridad
    const user = req.user || req.body.user;
    if (typeof req.body.priority === 'number' && (!user || !user.esAdmin)) {
      return res.status(403).json({ error: 'Solo el administrador puede modificar la prioridad de la liga' });
    }
    const update = {};
    if (typeof req.body.setsToWin === 'number') update.setsToWin = req.body.setsToWin;
    if (typeof req.body.lastSetPoints === 'number') update.lastSetPoints = req.body.lastSetPoints;
    if (typeof req.body.name === 'string') update.name = req.body.name;
    if (typeof req.body.pointsWin === 'number') update.pointsWin = req.body.pointsWin;
    if (typeof req.body.pointsLose === 'number') update.pointsLose = req.body.pointsLose;
    if (typeof req.body.priority === 'number') update.priority = req.body.priority;
    const liga = await Liga.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!liga) {
      return res.status(404).json({ error: 'Liga no encontrada' });
    }
    res.json(liga);
  } catch (err) {
    res.status(400).json({ error: 'No se pudo actualizar la liga', details: err.message });
  }
};

// Eliminar liga y sus equipos asociados (usando sistema de papelera)
const deleteLeague = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'Liga no encontrada (ID inválido)' });
    }
    const liga = await Liga.findById(id);
    if (!liga) return res.status(404).json({ error: 'Liga no encontrada' });
    
    // Enviar liga a papelera
    const now = new Date();
    await AuditLog.create({
      action: 'delete',
      entity: 'league',
      entityId: liga._id.toString(),
      data: liga.toObject(),
      user: getUserEmailFromRequest(req),
      isInTrash: true,
      scheduledDeletion: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 días
      deletedAt: now
    });
    
    // Enviar equipos asociados a papelera
    const equipos = await Equipo.find({ league: id });
    for (const equipo of equipos) {
      await AuditLog.create({
        action: 'delete',
        entity: 'team',
        entityId: equipo._id.toString(),
        data: equipo.toObject(),
        user: getUserEmailFromRequest(req),
        isInTrash: true,
        scheduledDeletion: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
        deletedAt: now
      });
    }
    
    // Eliminar liga después de registrar en papelera
    await Liga.findByIdAndDelete(id);
    await Equipo.deleteMany({ league: id });
    
    res.json({ message: 'Liga y equipos asociados enviados a papelera' });
  } catch (err) {
    if (err.name === 'CastError' || err.message?.includes('ObjectId')) {
      return res.status(404).json({ error: 'Liga no encontrada' });
    }
    res.status(500).json({ error: 'No se pudo eliminar la liga', details: err.message });
  }
};

module.exports = {
  createLeague,
  getLeagues,
  updateLeague,
  deleteLeague
};
