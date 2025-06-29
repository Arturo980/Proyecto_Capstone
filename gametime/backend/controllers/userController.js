const { Usuario } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendPasswordResetEmail } = require('../utils/emailService');

// Ruta de login de usuario
const login = async (req, res) => {
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
};

// Ruta de registro de usuario
const register = async (req, res) => {
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
};

// Crear usuario
const createUser = async (req, res) => {
  const usuario = new Usuario(req.body);
  await usuario.save();
  res.json(usuario);
};

// Obtener usuarios
const getUsers = async (req, res) => {
  const usuarios = await Usuario.find();
  res.json(usuarios);
};

// Gestión de solicitudes de cuenta
const getPendingSolicitudes = async (req, res) => {
  // Devuelve usuarios gestores y editores no aprobados
  const pendientes = await Usuario.find({
    aprobado: false,
    tipoCuenta: { $in: ['match-manager', 'content-editor'] },
  });
  res.json(pendientes);
};

const approveUser = async (req, res) => {
  const { id } = req.params;
  const usuario = await Usuario.findById(id);
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  usuario.aprobado = true;
  await usuario.save();
  res.json({ message: 'Usuario aprobado' });
};

const rejectUser = async (req, res) => {
  const { id } = req.params;
  const usuario = await Usuario.findById(id);
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  await usuario.deleteOne();
  res.json({ message: 'Usuario rechazado y eliminado' });
};

// Solicitar reset de contraseña
const requestPasswordReset = async (req, res) => {
  try {
    const { correo } = req.body;
    
    if (!correo) {
      return res.status(400).json({ error: 'El correo electrónico es requerido' });
    }

    // Buscar usuario por correo
    const usuario = await Usuario.findOne({ correo });
    if (!usuario) {
      // Por seguridad, no revelamos si el email existe o no
      return res.json({ 
        message: 'Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.' 
      });
    }

    // Generar token JWT con expiración de 1 hora
    const resetToken = jwt.sign(
      { userId: usuario._id, correo: usuario.correo },
      process.env.JWT_SECRET || 'gametime-secret-key',
      { expiresIn: '1h' }
    );

    // Guardar token y fecha de expiración en la base de datos
    usuario.resetPasswordToken = resetToken;
    usuario.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hora
    await usuario.save();

    // Enviar email
    const emailResult = await sendPasswordResetEmail(correo, resetToken);
    
    if (!emailResult.success) {
      console.error('Error enviando email:', emailResult.error);
      return res.status(500).json({ 
        error: 'Error enviando el correo de recuperación. Inténtalo de nuevo más tarde.' 
      });
    }

    res.json({ 
      message: 'Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.' 
    });
  } catch (error) {
    console.error('Error en requestPasswordReset:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Restablecer contraseña
const resetPassword = async (req, res) => {
  try {
    const { token, nuevaContraseña } = req.body;

    if (!token || !nuevaContraseña) {
      return res.status(400).json({ error: 'Token y nueva contraseña son requeridos' });
    }

    if (nuevaContraseña.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar token JWT
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'gametime-secret-key');
    } catch (jwtError) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    // Buscar usuario con el token y verificar que no haya expirado
    const usuario = await Usuario.findOne({
      _id: decodedToken.userId,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!usuario) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(nuevaContraseña, 10);

    // Actualizar contraseña y limpiar tokens de reset
    usuario.contraseña = hashedPassword;
    usuario.resetPasswordToken = undefined;
    usuario.resetPasswordExpires = undefined;
    await usuario.save();

    res.json({ message: 'Contraseña restablecida exitosamente' });
  } catch (error) {
    console.error('Error en resetPassword:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Verificar token de reset
const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: 'Token requerido' });
    }

    // Verificar token JWT
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'gametime-secret-key');
    } catch (jwtError) {
      return res.status(400).json({ error: 'Token inválido o expirado', valid: false });
    }

    // Buscar usuario con el token y verificar que no haya expirado
    const usuario = await Usuario.findOne({
      _id: decodedToken.userId,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!usuario) {
      return res.status(400).json({ error: 'Token inválido o expirado', valid: false });
    }

    res.json({ valid: true, message: 'Token válido' });
  } catch (error) {
    console.error('Error en verifyResetToken:', error);
    res.status(500).json({ error: 'Error interno del servidor', valid: false });
  }
};

module.exports = {
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
};
