const express = require('express');
const router = express.Router();
const { upload } = require('../config/multer');
const { 
  uploadMatchImages, 
  saveImageUrl, 
  getMatchImages, 
  deleteMatchImage, 
  uploadTeamLogo 
} = require('../controllers/imageController');

// Rutas de imágenes de partidos
router.post('/match-images/:partidoId', upload.array('images'), uploadMatchImages, saveImageUrl);
router.get('/match-images/:partidoId', getMatchImages);
router.delete('/match-images/:imageId', deleteMatchImage);

// Ruta para subir logo de equipo
router.post('/team-logos', upload.single('logo'), uploadTeamLogo);

module.exports = router;
