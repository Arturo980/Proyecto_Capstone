require('dotenv').config(); // Importar dotenv para cargar variables de entorno

const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');

// Importar configuraciones
const { validateEnv } = require('./config/env');
const connectDB = require('./config/database');
const { UPLOADS_DIR } = require('./config/multer');

// Validar variables de entorno
validateEnv();

// Importar modelos principales para la ruta raíz
const { Usuario, Liga, Equipo } = require('./models');

// Importar rutas
const leagueRoutes = require('./routes/leagues');
const teamRoutes = require('./routes/teams');
const gameRoutes = require('./routes/games');
const userRoutes = require('./routes/users');
const statsRoutes = require('./routes/stats');
const imageRoutes = require('./routes/images');
const newsRoutes = require('./routes/news');
const auditRoutes = require('./routes/audit');

// Importar middleware
const socketMiddleware = require('./middleware/socket');

const app = express();
app.use(cors()); // permite conexión desde React
app.use(express.json());

// Conectar a MongoDB
connectDB();

// Crear servidor HTTP y configurar Socket.IO
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT']
  }
});

// Middleware para inyectar socket.io en las rutas
app.use(socketMiddleware(io));

// Usar las rutas
app.use('/api/leagues', leagueRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/player-stats', statsRoutes);
app.use('/api/news', newsRoutes);
app.use('/api', imageRoutes);
app.use('/api', auditRoutes);
app.use('/', userRoutes);

// Ruta para servir imágenes estáticas
app.use('/uploads', express.static(UPLOADS_DIR));

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

// Ruta catch-all para evitar respuestas HTML
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 MongoDB URI configured: ${process.env.MONGO_URI ? 'Yes' : 'No'}`);
  console.log(`☁️ Cloudinary configured: ${process.env.CLOUDINARY_CLOUD_NAME ? 'Yes' : 'No'}`);
});