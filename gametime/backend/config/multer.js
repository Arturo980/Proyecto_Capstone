const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Carpeta donde se guardarán las imágenes
const UPLOADS_DIR = path.join(__dirname, '../uploads');
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

module.exports = { upload, UPLOADS_DIR };
