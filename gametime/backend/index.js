require('dotenv').config(); // Importar dotenv para cargar variables de entorno

// Validar variables de entorno críticas
const requiredEnvVars = ['MONGO_URI'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Variables de entorno faltantes:', missingEnvVars.join(', '));
  console.error('🔧 Asegúrate de que estas variables estén configuradas en tu archivo .env o en Render');
  process.exit(1);
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt'); // Importar bcrypt para hashing
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const http = require('http');
const socketio = require('socket.io');

// Configuración de Cloudinary usando variables de entorno
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
app.use(cors()); // permite conexión desde React
app.use(express.json());

const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT']
  }
});

// Conexión a MongoDB usando variables de entorno con manejo de errores mejorado
const connectToMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000, // 30 segundos timeout
      socketTimeoutMS: 45000, // 45 segundos timeout
      maxPoolSize: 10, // Máximo 10 conexiones en el pool
      minPoolSize: 2,  // Mínimo 2 conexiones en el pool
      maxIdleTimeMS: 30000, // Cerrar conexiones después de 30 segundos de inactividad
      retryWrites: true,
      w: 'majority'
    });
    console.log('✅ Conectado exitosamente a MongoDB Atlas');
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    console.error('Detalles del error:', error);
    
    // Intentar reconectar después de 5 segundos
    setTimeout(connectToMongoDB, 5000);
  }
};

// Manejar eventos de conexión
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose conectado a MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Error de conexión MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose desconectado de MongoDB');
  console.log('🔄 Intentando reconectar...');
  setTimeout(connectToMongoDB, 5000);
});

// Manejar el cierre graceful
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🛑 Conexión MongoDB cerrada debido a terminación de aplicación');
  process.exit(0);
});

// Iniciar la conexión
connectToMongoDB();

// Esquema de Usuario actualizado con campo 'esAdmin'
const Usuario = mongoose.model('Usuario', {
  nombre: { type: String, required: true },
  correo: { type: String, required: true, unique: true },
  contraseña: { type: String, required: true },
  tipoCuenta: { type: String, enum: ['match-manager', 'content-editor', 'public'], default: 'public' },
  aprobado: { type: Boolean, default: false },
  esAdmin: { type: Boolean, default: false }, // Nuevo campo para admin
});

// Modelo de Liga (colección de ligas) - agrega unique y configuración de sets
const Liga = mongoose.model('Liga', {
  name: { type: String, required: true, unique: true },
  setsToWin: { type: Number, default: 3 },      // Mejor de 5 por defecto (gana 3)
  lastSetPoints: { type: Number, default: 15 }, // Último set a 15 por defecto
  pointsWin: { type: Number, default: 3 },      // NUEVO: puntos por victoria
  pointsLose: { type: Number, default: 0 }      // NUEVO: puntos por derrota
});

// Modelo de estadísticas individuales por jugador
const PlayerStats = mongoose.model('PlayerStats', {
  playerName: { type: String, required: true },
  team: { type: String, required: true },
  league: { type: mongoose.Schema.Types.ObjectId, ref: 'Liga', required: true },
  acesPerSet: { type: Number, default: 0 },
  assistsPerSet: { type: Number, default: 0 },
  attacksPerSet: { type: Number, default: 0 },
  blocksPerSet: { type: Number, default: 0 },
  digsPerSet: { type: Number, default: 0 },
  hittingPercentage: { type: Number, default: 0 },
  killsPerSet: { type: Number, default: 0 },
  pointsPerSet: { type: Number, default: 0 }
});

// Modelo de Equipo con referencia a liga
const Equipo = mongoose.model('Equipo', {
  name: { type: String, required: true },
  abbr: { type: String, required: true }, // Nuevo: abreviación obligatoria
  logo: String,
  // roster: [String], // <-- reemplaza por:
  roster: [{
    name: { type: String, required: true },
    stats: {
      acesPerSet: { type: Number, default: 0 },
      assistsPerSet: { type: Number, default: 0 },
      attacksPerSet: { type: Number, default: 0 },
      blocksPerSet: { type: Number, default: 0 },
      digsPerSet: { type: Number, default: 0 },
      hittingPercentage: { type: Number, default: 0 },
      killsPerSet: { type: Number, default: 0 },
      pointsPerSet: { type: Number, default: 0 }
    }
  }],
  staff: [String],
  league: { type: mongoose.Schema.Types.ObjectId, ref: 'Liga', required: true }
});

// Modelo de Partido
const Partido = mongoose.model('Partido', {
  league: { type: mongoose.Schema.Types.ObjectId, ref: 'Liga', required: true },
  team1: { type: String, required: true },
  team2: { type: String, required: true },
  team1_abbr: { type: String, required: true }, // Nuevo: abbr equipo 1
  team2_abbr: { type: String, required: true }, // Nuevo: abbr equipo 2
  date: { type: String, required: true }, // formato: yyyy-mm-dd
  time: { type: String, required: true }, // formato: hh:mm
  score1: { type: Number, default: null },
  score2: { type: Number, default: null },
  citados: { type: String, default: '' }, // NUEVO: citados (string, lista separada por coma)
  sets1: { type: Number, default: null }, // NUEVO: sets ganados equipo 1
  sets2: { type: Number, default: null }, // NUEVO: sets ganados equipo 2
  // Guarda el historial de sets: [{score1, score2}, ...]
  setsHistory: { type: Array, default: [] },
  partidoFinalizado: { type: Boolean, default: false } // <-- Añadido explícitamente
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

// Modelo de Noticia
const Noticia = mongoose.model('Noticia', {
  title: { type: String, required: true },
  summary: { type: String, required: true },
  content: { type: String, required: true },
  mainImage: { type: String, required: true }, // Imagen principal obligatoria
  images: [String], // Otras imágenes opcionales
  createdAt: { type: Date, default: Date.now }
});

// Socket.IO marcador en vivo
io.on('connection', (socket) => {
  // Recibe score_update y lo reenvía a todos (menos al emisor)
  socket.on('score_update', ({ gameId, score1, score2 }) => {
    // Broadcast a todos menos al emisor
    socket.broadcast.emit('score_update', { gameId, score1, score2 });
  });
});

// --- API de Ligas ---
// Crear liga (verifica unicidad y guarda configuración)
app.post('/api/leagues', async (req, res) => {
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
      pointsWin: req.body.pointsWin ?? 3,   // NUEVO
      pointsLose: req.body.pointsLose ?? 0  // NUEVO
    });
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
    if (!mongoose.Types.ObjectId.isValid(id)) {
      // Cambia a 404 para que el frontend no lo interprete como error grave (opcional)
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
    // Siempre responde 200 si la liga ya no existe, para evitar errores molestos en frontend
    if (err.name === 'CastError' || err.message?.includes('ObjectId')) {
      return res.status(404).json({ error: 'Liga no encontrada' });
    }
    res.status(200).json({ message: 'Liga eliminada (con error interno, pero eliminada)' });
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
});

// POST /api/games
app.post('/api/games', async (req, res) => {
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
    io.emit('game_created', partido);
    res.status(201).json(partido);
  } catch (err) {
    res.status(400).json({ error: 'No se pudo crear el partido', details: err.message });
  }
});

// PUT /api/games/:id
app.put('/api/games/:id', async (req, res) => {
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
        const liga = await mongoose.model('Liga').findById(partido.league);
        if (liga && typeof liga.setsToWin === 'number') setsToWin = liga.setsToWin;
      }
      if (sets1 === setsToWin || sets2 === setsToWin) {
        partidoFinalizado = true;
      }
      update.partidoFinalizado = partidoFinalizado;
    }
    // Si partidoFinalizado viene explícitamente en el body, respétalo (por si acaso)
    if (typeof req.body.partidoFinalizado === 'boolean') {
      update.partidoFinalizado = req.body.partidoFinalizado;
    }
    const partido = await Partido.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!partido) return res.status(404).json({ error: 'Partido no encontrado' });

    // Emitir eventos de socket según el tipo de actualización
    if (
      Object.keys(req.body).length === 2 &&
      req.body.hasOwnProperty('score1') &&
      req.body.hasOwnProperty('score2')
    ) {
      io.emit('score_update', { gameId: id, score1: req.body.score1, score2: req.body.score2, partidoFinalizado: partido.partidoFinalizado });
    } else if (update.setsHistory) {
      io.emit('sets_history_update', {
        gameId: id,
        setsHistory: partido.setsHistory,
        sets1: partido.sets1,
        sets2: partido.sets2,
        score1: partido.score1,
        score2: partido.score2,
        partidoFinalizado: partido.partidoFinalizado
      });
    } else {
      io.emit('game_updated', partido);
    }
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
    io.emit('game_deleted', { _id: partido._id });
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

// Ruta para subir imágenes (varias a la vez, legacy: archivos físicos)
app.post('/api/match-images/:partidoId', upload.array('images'), async (req, res, next) => {
  // Si viene un archivo, sigue el flujo legacy (no Cloudinary)
  if (req.files && req.files.length > 0) {
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
    return;
  }
  // Si no hay archivos, pasa al siguiente handler (Cloudinary)
  next();
});

// NUEVO: Ruta para guardar solo la URL de Cloudinary (o cualquier URL) como imagen de partido
app.post('/api/match-images/:partidoId', async (req, res) => {
  try {
    const { partidoId } = req.params;
    const { url, alt = '' } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'No se proporcionó la URL de la imagen' });
    }
    const image = await MatchImage.create({
      partido: partidoId,
      url,
      alt
    });
    res.status(201).json({ image });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo guardar la imagen', details: err.message });
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
    // NUEVO: Si la imagen es de Cloudinary, eliminarla también de Cloudinary
    if (deleted.url && deleted.url.startsWith('http') && deleted.url.includes('cloudinary.com')) {
      // Extraer public_id de la URL de Cloudinary
      try {
        // Ejemplo de URL: https://res.cloudinary.com/dfcjvah1g/image/upload/v1717712345/filename.jpg
        // public_id = todo después de /upload/ y antes de la extensión
        const matches = deleted.url.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
        if (matches && matches[1]) {
          const publicId = matches[1];
          await cloudinary.uploader.destroy(publicId, { invalidate: true });
        }
      } catch (cloudErr) {
        console.error('Error al eliminar imagen de Cloudinary:', cloudErr);
      }
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

// Listar SOLO acciones de eliminación (delete) de cualquier usuario y entidad
app.get('/api/audit-log', async (req, res) => {
  // Devuelve solo logs de acción 'delete', ordenados por fecha descendente
  const logs = await AuditLog.find({ action: 'delete' }).sort({ timestamp: -1 }).limit(200);
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

// Ruta de registro de usuario (POST /register)
app.post('/register', async (req, res) => {
  try {
    const { nombre, correo, contraseña, tipoCuenta } = req.body;
    if (!nombre || !correo || !contraseña) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    // Verifica si ya existe un usuario con ese correo
    const exists = await Usuario.findOne({ correo });
    if (exists) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese correo' });
    }
    // Hashea la contraseña antes de guardar
    const hashedPassword = await bcrypt.hash(contraseña, 10);
    const nuevoUsuario = new Usuario({
      nombre,
      correo,
      contraseña: hashedPassword,
      tipoCuenta: tipoCuenta || 'public',
      aprobado: (tipoCuenta === 'public' || !tipoCuenta), // público no requiere aprobación
      esAdmin: false
    });
    await nuevoUsuario.save();
    // No enviar la contraseña al frontend
    const usuarioSinContraseña = nuevoUsuario.toObject();
    delete usuarioSinContraseña.contraseña;
    res.status(201).json({ usuario: usuarioSinContraseña });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo registrar el usuario', details: err.message });
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

// --- Asegúrate de que este endpoint esté antes de app.use((req, res) => ...)
app.put('/api/leagues/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Elimina los DEBUG logs
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de liga inválido (no es un ObjectId)' });
    }
    const update = {};
    if (typeof req.body.setsToWin === 'number') update.setsToWin = req.body.setsToWin;
    if (typeof req.body.lastSetPoints === 'number') update.lastSetPoints = req.body.lastSetPoints;
    if (typeof req.body.name === 'string') update.name = req.body.name;
    if (typeof req.body.pointsWin === 'number') update.pointsWin = req.body.pointsWin;   // NUEVO
    if (typeof req.body.pointsLose === 'number') update.pointsLose = req.body.pointsLose; // NUEVO
    const liga = await Liga.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!liga) {
      return res.status(404).json({ error: 'Liga no encontrada' });
    }
    res.json(liga);
  } catch (err) {
    res.status(400).json({ error: 'No se pudo actualizar la liga', details: err.message });
  }
});

app.get('/api/games/week', async (req, res) => {
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

    // DEBUG: imprime el rango de fechas y la query
    console.log('Rango de semana:', startOfWeek.toISOString().slice(0, 10), '-', endOfWeek.toISOString().slice(0, 10));
    console.log('Query:', query);

    const partidos = await mongoose.model('Partido').find(query).populate('league');
    // DEBUG: imprime las fechas de los partidos encontrados
    console.log('Partidos encontrados:', partidos.map(p => ({
      date: p.date,
      time: p.time,
      team1: p.team1,
      team2: p.team2,
      league: p.league?.name
    })));

    // Cambia la respuesta para mantener compatibilidad con el frontend:
    // El frontend espera un array, no un objeto { partidos }
    // Por compatibilidad, mapea igual que antes:
    const equipos = await mongoose.model('Equipo').find();
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
});

// --- API de estadísticas individuales de jugadores ---

// GET /api/player-stats?league=ID
app.get('/api/player-stats', async (req, res) => {
  try {
    const { league } = req.query;
    let filter = {};
    if (league) filter.league = league;
    // Populate league name for frontend display (optional)
    const stats = await PlayerStats.find(filter).populate('league', 'name');
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'No se pudieron obtener las estadísticas', details: err.message });
  }
});

// POST /api/player-stats (crear o actualizar stats de un jugador)
app.post('/api/player-stats', async (req, res) => {
  try {
    const { playerName, team, league, ...stats } = req.body;
    if (!playerName || !team || !league) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    // Busca si ya existe stats para este jugador/equipo/liga
    let playerStats = await PlayerStats.findOne({ playerName, team, league });
    if (playerStats) {
      Object.assign(playerStats, stats);
      await playerStats.save();
    } else {
      playerStats = await PlayerStats.create({ playerName, team, league, ...stats });
    }
    res.json(playerStats);
  } catch (err) {
    res.status(400).json({ error: 'No se pudieron guardar las estadísticas', details: err.message });
  }
});

// PUT /api/player-stats (actualizar múltiples stats)
app.put('/api/player-stats', async (req, res) => {
  try {
    const statsArray = Array.isArray(req.body) ? req.body : [];
    const updatedStats = [];
    for (const stat of statsArray) {
      const { playerName, team, league, ...rest } = stat;
      if (!playerName || !team || !league) continue;
      let playerStats = await PlayerStats.findOne({ playerName, team, league });
      if (playerStats) {
        Object.assign(playerStats, rest);
        await playerStats.save();
      } else {
        playerStats = await PlayerStats.create({ playerName, team, league, ...rest });
      }
      updatedStats.push(playerStats);
    }
    res.json(updatedStats);
  } catch (err) {
    res.status(400).json({ error: 'No se pudieron actualizar las estadísticas', details: err.message });
  }
});

// DELETE /api/player-stats/:id (eliminar estadísticas de un jugador)
app.delete('/api/player-stats/:id', async (req, res) => {
  try {
    const deleted = await PlayerStats.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Estadística no encontrada' });
    }
    res.json({ message: 'Estadística eliminada' });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo eliminar la estadística', details: err.message });
  }
});

// --- API de Noticias ---
// Crear noticia
app.post('/api/news', async (req, res) => {
  try {
    // Validar que mainImage esté presente
    if (!req.body.mainImage) {
      return res.status(400).json({ error: 'La imagen principal es obligatoria' });
    }
    const noticia = await Noticia.create(req.body);
    res.status(201).json(noticia);
  } catch (err) {
    res.status(400).json({ error: 'No se pudo crear la noticia', details: err.message });
  }
});
// Obtener todas las noticias
app.get('/api/news', async (req, res) => {
  const noticias = await Noticia.find().sort({ createdAt: -1 });
  res.json(noticias);
});
// Obtener noticia por ID
app.get('/api/news/:id', async (req, res) => {
  try {
    const noticia = await Noticia.findById(req.params.id);
    if (!noticia) return res.status(404).json({ error: 'Noticia no encontrada' });
    res.json(noticia);
  } catch (err) {
    res.status(400).json({ error: 'No se pudo obtener la noticia', details: err.message });
  }
});
// Eliminar noticia por ID
app.delete('/api/news/:id', async (req, res) => {
  try {
    const deleted = await Noticia.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Noticia no encontrada' });
    }
    res.json({ message: 'Noticia eliminada' });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo eliminar la noticia', details: err.message });
  }
});
// Actualizar noticia por ID
app.put('/api/news/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Validar que mainImage esté presente si se actualiza
    if (req.body.mainImage === '' || req.body.mainImage === undefined) {
      return res.status(400).json({ error: 'La imagen principal es obligatoria' });
    }
    // Solo permite actualizar los campos válidos
    const update = {
      title: req.body.title,
      summary: req.body.summary,
      content: req.body.content,
      mainImage: req.body.mainImage,
      images: req.body.images
    };
    const noticia = await Noticia.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!noticia) return res.status(404).json({ error: 'Noticia no encontrada' });
    res.json(noticia);
  } catch (err) {
    res.status(400).json({ error: 'No se pudo actualizar la noticia', details: err.message });
  }
});

// Ruta catch-all para evitar respuestas HTML
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 5000;

// Función auxiliar para obtener email del usuario (placeholder para auditoría)
function getUserEmailFromRequest(req) {
  // Aquí podrías implementar la lógica para obtener el email del usuario autenticado
  // Por ahora retorna un placeholder
  return req.headers['user-email'] || 'usuario-anonimo';
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 MongoDB URI configured: ${process.env.MONGO_URI ? 'Yes' : 'No'}`);
  console.log(`☁️ Cloudinary configured: ${process.env.CLOUDINARY_CLOUD_NAME ? 'Yes' : 'No'}`);
});