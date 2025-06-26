# GameTime Backend - Estructura Reorganizada

## 📁 Estructura de Directorios

```
backend/
├── config/
│   ├── database.js          # Configuración de MongoDB
│   ├── cloudinary.js        # Configuración de Cloudinary
│   ├── multer.js            # Configuración de Multer para uploads
│   └── env.js               # Validación de variables de entorno
├── models/
│   ├── index.js             # Exportador de todos los modelos
│   ├── Usuario.js           # Modelo de Usuario
│   ├── Liga.js              # Modelo de Liga
│   ├── Equipo.js            # Modelo de Equipo
│   ├── Partido.js           # Modelo de Partido
│   ├── PlayerStats.js       # Modelo de Estadísticas de Jugador
│   ├── MatchImage.js        # Modelo de Imagen de Partido
│   ├── Noticia.js           # Modelo de Noticia
│   └── AuditLog.js          # Modelo de Auditoría
├── controllers/
│   ├── userController.js    # Lógica de usuarios y autenticación
│   ├── leagueController.js  # Lógica de ligas
│   ├── teamController.js    # Lógica de equipos
│   ├── gameController.js    # Lógica de partidos
│   ├── statsController.js   # Lógica de estadísticas
│   ├── imageController.js   # Lógica de imágenes
│   ├── newsController.js    # Lógica de noticias
│   └── auditController.js   # Lógica de auditoría
├── routes/
│   ├── users.js             # Rutas de usuarios (/login, /register, etc.)
│   ├── leagues.js           # Rutas de ligas (/api/leagues)
│   ├── teams.js             # Rutas de equipos (/api/teams)
│   ├── games.js             # Rutas de partidos (/api/games)
│   ├── stats.js             # Rutas de estadísticas (/api/player-stats)
│   ├── images.js            # Rutas de imágenes (/api/match-images, /api/team-logos)
│   ├── news.js              # Rutas de noticias (/api/news)
│   └── audit.js             # Rutas de auditoría (/api/audit-log, /api/restore)
├── middleware/
│   └── socket.js            # Middleware para inyectar Socket.IO
├── utils/
│   └── auth.js              # Utilidades de autenticación
├── uploads/                 # Directorio para archivos subidos
├── index.js                 # Archivo principal del servidor
├── package.json
└── README_STRUCTURE.md      # Este archivo
```

## 🚀 Beneficios de la Nueva Estructura

### **Separación de Responsabilidades**
- **Modelos**: Definición de esquemas de base de datos
- **Controladores**: Lógica de negocio
- **Rutas**: Definición de endpoints
- **Configuración**: Configuraciones centralizadas
- **Middleware**: Funciones intermedias reutilizables

### **Mantenibilidad**
- Código más fácil de encontrar y modificar
- Cada archivo tiene una responsabilidad específica
- Estructura escalable para futuras funcionalidades

### **Reutilización**
- Controladores pueden ser reutilizados en diferentes rutas
- Modelos centralizados y fáciles de importar
- Configuraciones compartidas

## 🔧 Cómo Usar la Nueva Estructura

### **Agregar un Nuevo Modelo**
1. Crear archivo en `/models/`
2. Exportar el modelo en `/models/index.js`

### **Agregar Nuevas Rutas**
1. Crear controlador en `/controllers/`
2. Crear archivo de rutas en `/routes/`
3. Importar y usar las rutas en `index.js`

### **Modificar Funcionalidad Existente**
1. Encontrar el controlador correspondiente
2. Modificar la lógica de negocio
3. Las rutas se actualizan automáticamente

## 📝 Rutas Disponibles

### **Usuarios y Autenticación**
- `POST /login` - Iniciar sesión
- `POST /register` - Registrar usuario
- `GET /solicitudes-pendientes` - Ver solicitudes pendientes
- `POST /aprobar-usuario/:id` - Aprobar usuario
- `POST /rechazar-usuario/:id` - Rechazar usuario

### **Ligas**
- `GET /api/leagues` - Listar ligas
- `POST /api/leagues` - Crear liga
- `PUT /api/leagues/:id` - Actualizar liga
- `DELETE /api/leagues/:id` - Eliminar liga

### **Equipos**
- `GET /api/teams` - Listar equipos
- `POST /api/teams` - Crear equipo
- `PUT /api/teams/:id` - Actualizar equipo
- `DELETE /api/teams/:id` - Eliminar equipo

### **Partidos**
- `GET /api/games` - Listar partidos
- `GET /api/games/week` - Partidos de la semana
- `POST /api/games` - Crear partido
- `PUT /api/games/:id` - Actualizar partido
- `DELETE /api/games/:id` - Eliminar partido

### **Estadísticas**
- `GET /api/player-stats` - Estadísticas de jugadores
- `POST /api/player-stats` - Crear/actualizar estadísticas
- `PUT /api/player-stats` - Actualizar múltiples estadísticas
- `DELETE /api/player-stats/:id` - Eliminar estadísticas

### **Noticias**
- `GET /api/news` - Listar noticias
- `GET /api/news/:id` - Obtener noticia específica
- `POST /api/news` - Crear noticia
- `PUT /api/news/:id` - Actualizar noticia
- `DELETE /api/news/:id` - Eliminar noticia

### **Imágenes**
- `POST /api/match-images/:partidoId` - Subir imágenes de partido
- `GET /api/match-images/:partidoId` - Obtener imágenes de partido
- `DELETE /api/match-images/:imageId` - Eliminar imagen
- `POST /api/team-logos` - Subir logo de equipo

### **Auditoría**
- `GET /api/audit-log` - Ver log de auditoría
- `POST /api/restore/:entity/:id` - Restaurar entidad eliminada

## 🛠️ Tecnologías Utilizadas

- **Express.js** - Framework web
- **Mongoose** - ODM para MongoDB
- **Socket.IO** - Comunicación en tiempo real
- **Multer** - Manejo de archivos
- **Cloudinary** - Almacenamiento de imágenes
- **bcrypt** - Hashing de contraseñas

## 🔄 Migración del Código Anterior

El código anterior que estaba todo en `index.js` ha sido reorganizado de la siguiente manera:

- **Modelos**: Movidos a `/models/`
- **Rutas**: Separadas por funcionalidad en `/routes/`
- **Lógica de negocio**: Extraída a `/controllers/`
- **Configuraciones**: Centralizadas en `/config/`
- **Utilidades**: Organizadas en `/utils/`

Todas las funcionalidades existentes se mantienen, solo están mejor organizadas.
