const express = require('express');
const router = express.Router();
const { 
  login, 
  register, 
  createUser, 
  getUsers, 
  getPendingSolicitudes, 
  approveUser, 
  rejectUser,
  requestPasswordReset,
  resetPassword,
  verifyResetToken
} = require('../controllers/userController');

// Rutas de autenticación
router.post('/login', login);
router.post('/register', register);

// Rutas de usuarios
router.post('/usuarios', createUser);
router.get('/usuarios', getUsers);

// Rutas de gestión de solicitudes
router.get('/solicitudes-pendientes', getPendingSolicitudes);
router.post('/aprobar-usuario/:id', approveUser);
router.post('/rechazar-usuario/:id', rejectUser);

// Rutas de recuperación de contraseña
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.get('/verify-reset-token/:token', verifyResetToken);

module.exports = router;
