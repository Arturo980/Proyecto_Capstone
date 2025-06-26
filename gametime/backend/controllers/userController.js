const { Usuario } = require('../models');
const bcrypt = require('bcrypt');

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

module.exports = {
  login,
  register,
  createUser,
  getUsers,
  getPendingSolicitudes,
  approveUser,
  rejectUser
};
