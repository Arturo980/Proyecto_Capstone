require('dotenv').config(); // Importar dotenv para cargar variables de entorno
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt'); // Importar bcrypt para hashing
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

// Modelo de Partido
const Partido = mongoose.model('Partido', {
  league: { type: mongoose.Schema.Types.ObjectId, ref: 'Liga', required: true },
  team1: { type: String, required: true },
  team2: { type: String, required: true },
  date: { type: String, required: true }, // formato: yyyy-mm-dd
  time: { type: String, required: true }, // formato: hh:mm
  score1: { type: Number, default: null },
  score2: { type: Number, default: null }
});

// Carpeta donde se guardarán las imágenes
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

// Configuración de Multer para guardar archivos en disco
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    // Nombre único: partidoId-timestamp-originalname
    const partidoId = req.params.partidoId || 'unknown';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${partidoId}-${uniqueSuffix}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// Modelo de imagen (solo URL y alt)
const MatchImage = mongoose.model('MatchImage', {
  partido: { type: mongoose.Schema.Types.ObjectId, ref: 'Partido', required: true },
  url: { type: String, required: true },
  alt: { type: String, default: '' }
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
    await AuditLog.create({
      action: 'delete',
      entity: 'league',
      entityId: liga._id.toString(),
      data: liga.toObject(),
      user: getUserEmailFromRequest(req)
    });
    const equipos = await Equipo.find({ league: req.params.id });
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
    const equipo = await Equipo.findByIdAndDelete(req.params.id);
    if (!equipo) return res.status(404).json({ error: 'Equipo no encontrado' });
    await AuditLog.create({
      action: 'delete',
      entity: 'team',
      entityId: equipo._id.toString(),
      data: equipo.toObject(),
      user: getUserEmailFromRequest(req)
    });
    res.json({ message: 'Equipo eliminado' });
  } catch (err) {
    res.status(400).json({ error: 'No se pudo eliminar el equipo', details: err.message });
  }
});

// --- API de Partidos ---
// GET /api/games?league=ID
app.get('/api/games', async (req, res) => {
  try {
    const { league } = req.query;
    let query = {};
    if (league) query.league = league;
    const games = await Partido.find(query).sort({ date: 1, time: 1 });
    res.json({ games });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo obtener los partidos', details: err.message });
  }
});

// POST /api/games
app.post('/api/games', async (req, res) => {
  try {
    const partido = new Partido(req.body);
    await partido.save();
    res.status(201).json(partido);
  } catch (err) {
    res.status(400).json({ error: 'No se pudo crear el partido', details: err.message });
  }
});

// PUT /api/games/:id
app.put('/api/games/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const partido = await Partido.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!partido) return res.status(404).json({ error: 'Partido no encontrado' });
    res.json(partido);
  } catch (err) {
    res.status(400).json({ error: 'No se pudo actualizar el partido', details: err.message });
  }
});

// DELETE /api/games/:id
app.delete('/api/games/:id', async (req, res) => {
  try {
    const partido = await Partido.findByIdAndDelete(req.params.id);
    if (!partido) return res.status(404).json({ error: 'Partido no encontrado' });
    await AuditLog.create({
      action: 'delete',
      entity: 'game',
      entityId: partido._id.toString(),
      data: partido.toObject(),
      user: getUserEmailFromRequest(req)
    });
    res.json({ message: 'Partido eliminado' });
  } catch (err) {
    res.status(400).json({ error: 'No se pudo eliminar el partido', details: err.message });
  }
});

// Ruta para subir imágenes (varias a la vez)
app.post('/api/match-images/:partidoId', upload.array('images'), async (req, res) => {
  try {
    const { partidoId } = req.params;
    const alts = req.body.alts;
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No se subieron imágenes' });
    }
    // Maneja alts como array o string
    let altArr = [];
    if (Array.isArray(alts)) altArr = alts;
    else if (typeof alts === 'string') altArr = [alts];

    // Guarda la URL relativa (puedes cambiar a absoluta si tienes dominio)
    const docs = await MatchImage.insertMany(
      files.map((file, idx) => ({
        partido: partidoId,
        url: `/uploads/${file.filename}`,
        alt: altArr[idx] || ''
      }))
    );
    res.status(201).json({ images: docs });
  } catch (err) {
    res.status(500).json({ error: 'No se pudieron guardar las imágenes', details: err.message });
  }
});

// Ruta para servir imágenes estáticas
app.use('/uploads', express.static(UPLOADS_DIR));

// Ruta para obtener imágenes de un partido (solo URLs y alt)
app.get('/api/match-images/:partidoId', async (req, res) => {
  try {
    const images = await MatchImage.find({ partido: req.params.partidoId });
    res.json({ images });
  } catch (err) {
    res.status(500).json({ error: 'No se pudieron obtener las imágenes', details: err.message });
  }
});

// Ruta para eliminar una imagen por su ID
app.delete('/api/match-images/:imageId', async (req, res) => {
  try {
    const deleted = await MatchImage.findByIdAndDelete(req.params.imageId);
    if (!deleted) {
      return res.status(404).json({ error: 'Imagen no encontrada' });
    }
    await AuditLog.create({
      action: 'delete',
      entity: 'image',
      entityId: deleted._id.toString(),
      data: deleted.toObject(),
      user: getUserEmailFromRequest(req)
    });
    // Eliminar el archivo físico del disco si existe
    if (deleted.url && deleted.url.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, deleted.url);
      fs.unlink(filePath, (err) => {
        if (err && err.code !== 'ENOENT') {
          console.error('Error al eliminar archivo físico:', err);
        }
      });
    }
    res.json({ message: 'Imagen eliminada' });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo eliminar la imagen', details: err.message });
  }
});

// --- AUDITORÍA Y RESTAURACIÓN ---

// Modelo de auditoría
const AuditLog = mongoose.model('AuditLog', {
  action: { type: String, required: true }, // 'delete', 'restore', etc.
  entity: { type: String, required: true }, // 'team', 'league', 'game', 'image'
  entityId: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed }, // Datos previos a la eliminación
  timestamp: { type: Date, default: Date.now },
  user: { type: String }, // correo del usuario que hizo la acción
});

// Listar acciones de auditoría (solo admin)
app.get('/api/audit-log', async (req, res) => {
  // Puedes agregar autenticación/rol aquí si lo deseas
  const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(200);
  res.json({ logs });
});

// Restaurar entidad eliminada (solo admin)
app.post('/api/restore/:entity/:id', async (req, res) => {
  const { entity, id } = req.params;
  const log = await AuditLog.findOne({ entity, entityId: id, action: 'delete' }).sort({ timestamp: -1 });
  if (!log) return res.status(404).json({ error: 'No hay datos para restaurar' });

  let restored;
  if (entity === 'team') {
    restored = await Equipo.create(log.data);
  } else if (entity === 'league') {
    restored = await Liga.create(log.data);
  } else if (entity === 'game') {
    restored = await Partido.create(log.data);
  } else if (entity === 'image') {
    restored = await MatchImage.create(log.data);
  } else {
    return res.status(400).json({ error: 'Entidad no soportada' });
  }
  await AuditLog.create({
    action: 'restore',
    entity,
    entityId: id,
    data: log.data,
    user: getUserEmailFromRequest(req)
  });
  res.json({ message: 'Restaurado', restored });
});

// Ruta raíz para comprobar que el servidor funciona y muestra datos de la base
app.get('/', async (req, res) => {
  try {
    const usuariosCount = await Usuario.countDocuments();
    const ligasCount = await Liga.countDocuments();
    const equiposCount = await Equipo.countDocuments();
    res.json({
      message: 'API funcionando',
      usuarios: usuariosCount,
      ligas: ligasCount,
      equipos: equiposCount
    });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo leer la base de datos', details: err.message });
  }
});

// Ruta de login de usuario
app.post('/login', async (req, res) => {
  const { correo, contraseña } = req.body;
  try {
    const usuario = await Usuario.findOne({ correo });
    if (!usuario) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    // Verifica la contraseña con bcrypt
    const passwordMatch = await bcrypt.compare(contraseña, usuario.contraseña);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    // Si la cuenta requiere aprobación y no está aprobada
    if ((usuario.tipoCuenta === 'match-manager' || usuario.tipoCuenta === 'content-editor') && !usuario.aprobado) {
      return res.status(403).json({ error: 'Tu cuenta aún no ha sido aprobada por el administrador.' });
    }
    // No enviar la contraseña al frontend
    const usuarioSinContraseña = usuario.toObject();
    delete usuarioSinContraseña.contraseña;
    res.json({ usuario: usuarioSinContraseña });
  } catch (err) {
    res.status(500).json({ error: 'Error en el servidor', details: err.message });
  }
});

// Ruta para subir logo de equipo (devuelve la URL)
app.post('/api/team-logos', upload.single('logo'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ninguna imagen' });
  }
  // Devuelve la URL relativa
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

// Ruta catch-all para evitar respuestas HTML
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.listen(process.env.PORT || 3001, () => {
  console.log(`Servidor corriendo en http://localhost:${process.env.PORT || 3001}`);
});
