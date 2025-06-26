const { Noticia, AuditLog } = require('../models');
const { getUserEmailFromRequest } = require('../utils/auth');

// Crear noticia
const createNews = async (req, res) => {
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
};

// Obtener todas las noticias
const getNews = async (req, res) => {
  const noticias = await Noticia.find().sort({ createdAt: -1 });
  res.json(noticias);
};

// Obtener noticia por ID
const getNewsById = async (req, res) => {
  try {
    const noticia = await Noticia.findById(req.params.id);
    if (!noticia) return res.status(404).json({ error: 'Noticia no encontrada' });
    res.json(noticia);
  } catch (err) {
    res.status(400).json({ error: 'No se pudo obtener la noticia', details: err.message });
  }
};

// Eliminar noticia por ID (usando sistema de papelera)
const deleteNews = async (req, res) => {
  try {
    const noticia = await Noticia.findById(req.params.id);
    if (!noticia) {
      return res.status(404).json({ error: 'Noticia no encontrada' });
    }
    
    // Enviar a papelera
    const now = new Date();
    await AuditLog.create({
      action: 'delete',
      entity: 'news',
      entityId: noticia._id.toString(),
      data: noticia.toObject(),
      user: getUserEmailFromRequest(req),
      isInTrash: true,
      scheduledDeletion: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 días
      deletedAt: now
    });
    
    // Eliminar después de registrar en papelera
    await Noticia.findByIdAndDelete(req.params.id);
    res.json({ message: 'Noticia enviada a papelera' });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo eliminar la noticia', details: err.message });
  }
};

// Actualizar noticia por ID
const updateNews = async (req, res) => {
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
};

module.exports = {
  createNews,
  getNews,
  getNewsById,
  deleteNews,
  updateNews
};
