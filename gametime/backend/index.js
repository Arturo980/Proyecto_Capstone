require('dotenv').config(); // Importar dotenv para cargar variables de entorno
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt'); // Importar bcrypt para hashing

const app = express();
app.use(cors()); // permite conexión desde React
app.use(express.json());

// Conexión a MongoDB usando variables de entorno
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Esquema de Usuario actualizado con campo 'esAdmin'
const Usuario = mongoose.model('Usuario', {
  nombre: { type: String, required: true },
  correo: { type: String, required: true, unique: true },
  contraseña: { type: String, required: true },
  tipoCuenta: { type: String, enum: ['match-manager', 'content-editor', 'public'], default: 'public' },
  aprobado: { type: Boolean, default: false },
  esAdmin: { type: Boolean, default: false }, // Nuevo campo para admin
});

// Modelo de Liga (colección de ligas) - agrega unique
const Liga = mongoose.model('Liga', {
  name: { type: String, required: true, unique: true }
});

// Modelo de Equipo con referencia a liga
const Equipo = mongoose.model('Equipo', {
  name: { type: String, required: true },
  logo: String,
  roster: [String],
  staff: [String],
  league: { type: mongoose.Schema.Types.ObjectId, ref: 'Liga', required: true }
});

// --- API de Ligas ---
// Crear liga (verifica unicidad)
app.post('/api/leagues', async (req, res) => {
  try {
    // Verifica si ya existe una liga con ese nombre (case-insensitive)
    const exists = await Liga.findOne({ name: { $regex: new RegExp('^' + req.body.name + '$', 'i') } });
    if (exists) {
      return res.status(400).json({ error: 'Ya existe una liga con ese nombre' });
    }
    const liga = new Liga({ name: req.body.name });
    await liga.save();
    res.status(201).json(liga);
  } catch (err) {
    res.status(400).json({ error: 'No se pudo crear la liga', details: err.message });
  }
});

// Listar ligas
app.get('/api/leagues', async (req, res) => {
  const ligas = await Liga.find();
  res.json(ligas);
});

// Eliminar liga y sus equipos asociados
app.delete('/api/leagues/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const liga = await Liga.findByIdAndDelete(id);
    if (!liga) return res.status(404).json({ error: 'Liga no encontrada' });
    // Elimina todos los equipos asociados a la liga
    await Equipo.deleteMany({ league: id });
    res.json({ message: 'Liga y equipos asociados eliminados' });
  } catch (err) {
    res.status(400).json({ error: 'No se pudo eliminar la liga', details: err.message });
  }
});

// --- Rutas para gestión de solicitudes de cuenta (solo para admin, sin autenticación aquí)
app.get('/solicitudes-pendientes', async (req, res) => {
  // Devuelve usuarios gestores y editores no aprobados
  const pendientes = await Usuario.find({
    aprobado: false,
    tipoCuenta: { $in: ['match-manager', 'content-editor'] },
  });
  res.json(pendientes);
});

app.post('/aprobar-usuario/:id', async (req, res) => {
  const { id } = req.params;
  const usuario = await Usuario.findById(id);
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  usuario.aprobado = true;
  await usuario.save();
  res.json({ message: 'Usuario aprobado' });
});

app.post('/rechazar-usuario/:id', async (req, res) => {
  const { id } = req.params;
  const usuario = await Usuario.findById(id);
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  await usuario.deleteOne();
  res.json({ message: 'Usuario rechazado y eliminado' });
});

// Rutas API
app.post('/usuarios', async (req, res) => {
  const usuario = new Usuario(req.body);
  await usuario.save();
  res.json(usuario);
});

app.get('/usuarios', async (req, res) => {
  const usuarios = await Usuario.find();
  res.json(usuarios);
});

// --- API de Equipos y Liga ---
// GET /api/teams?league=ID - Lista equipos de una liga
app.get('/api/teams', async (req, res) => {
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
});

// POST /api/teams - Crear equipo (requiere league)
app.post('/api/teams', async (req, res) => {
  try {
    const equipo = new Equipo(req.body);
    await equipo.save();
    res.status(201).json(equipo);
  } catch (err) {
    res.status(400).json({ error: 'No se pudo crear el equipo', details: err.message });
  }
});

// PUT /api/teams/:id - Editar equipo
app.put('/api/teams/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const equipo = await Equipo.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!equipo) return res.status(404).json({ error: 'Equipo no encontrado' });
    res.json(equipo);
  } catch (err) {
    res.status(400).json({ error: 'No se pudo actualizar el equipo', details: err.message });
  }
});

// DELETE /api/teams/:id - Eliminar equipo
app.delete('/api/teams/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const equipo = await Equipo.findByIdAndDelete(id);
    if (!equipo) return res.status(404).json({ error: 'Equipo no encontrado' });
    res.json({ message: 'Equipo eliminado' });
  } catch (err) {
    res.status(400).json({ error: 'No se pudo eliminar el equipo', details: err.message });
  }
});

// Ruta catch-all para evitar respuestas HTML
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.listen(process.env.PORT || 3001, () => {
  console.log(`Servidor corriendo en http://localhost:${process.env.PORT || 3001}`);
});
