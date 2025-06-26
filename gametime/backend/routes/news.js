const express = require('express');
const router = express.Router();
const { createNews, getNews, getNewsById, deleteNews, updateNews } = require('../controllers/newsController');

// Rutas de noticias
router.post('/', createNews);
router.get('/', getNews);
router.get('/:id', getNewsById);
router.put('/:id', updateNews);
router.delete('/:id', deleteNews);

module.exports = router;
