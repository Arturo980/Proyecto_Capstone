const { MatchImage, AuditLog } = require('../models');
const cloudinary = require('../config/cloudinary');
const path = require('path');
const fs = require('fs');
const { getUserEmailFromRequest } = require('../utils/auth');

// Ruta para subir imágenes (varias a la vez, legacy: archivos físicos)
const uploadMatchImages = async (req, res, next) => {
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
};

// Ruta para guardar solo la URL de Cloudinary (o cualquier URL) como imagen de partido
const saveImageUrl = async (req, res) => {
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
};

// Ruta para obtener imágenes de un partido (solo URLs y alt)
const getMatchImages = async (req, res) => {
  try {
    const images = await MatchImage.find({ partido: req.params.partidoId });
    res.json({ images });
  } catch (err) {
    res.status(500).json({ error: 'No se pudieron obtener las imágenes', details: err.message });
  }
};

// Ruta para eliminar una imagen por su ID
const deleteMatchImage = async (req, res) => {
  try {
    const image = await MatchImage.findById(req.params.imageId);
    if (!image) {
      return res.status(404).json({ error: 'Imagen no encontrada' });
    }
    
    // Enviar a papelera
    const now = new Date();
    await AuditLog.create({
      action: 'delete',
      entity: 'image',
      entityId: image._id.toString(),
      data: image.toObject(),
      user: getUserEmailFromRequest(req),
      isInTrash: true,
      scheduledDeletion: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 días
      deletedAt: now
    });
    
    // Eliminar de la base de datos después de registrar en papelera
    await MatchImage.findByIdAndDelete(req.params.imageId);
    
    // Eliminar el archivo físico del disco si existe
    if (image.url && image.url.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', image.url);
      fs.unlink(filePath, (err) => {
        if (err && err.code !== 'ENOENT') {
          console.error('Error al eliminar archivo físico:', err);
        }
      });
    }
    
    // Si la imagen es de Cloudinary, eliminarla también de Cloudinary
    if (image.url && image.url.startsWith('http') && image.url.includes('cloudinary.com')) {
      try {
        const matches = image.url.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
        if (matches && matches[1]) {
          const publicId = matches[1];
          await cloudinary.uploader.destroy(publicId, { invalidate: true });
        }
      } catch (cloudErr) {
        console.error('Error al eliminar imagen de Cloudinary:', cloudErr);
      }
    }
    
    res.json({ message: 'Imagen enviada a papelera' });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo eliminar la imagen', details: err.message });
  }
};

// Ruta para subir logo de equipo (devuelve la URL)
const uploadTeamLogo = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ninguna imagen' });
  }
  // Devuelve la URL relativa
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
};

module.exports = {
  uploadMatchImages,
  saveImageUrl,
  getMatchImages,
  deleteMatchImage,
  uploadTeamLogo
};
