// Middleware para verificar si el usuario es admin
const isAdmin = (req, res, next) => {
  // El usuario debe estar autenticado y ser admin
  // Puedes ajustar esto según cómo manejes la autenticación (por ejemplo, usando JWT)
  const user = req.user || req.body.user;
  if (!user || !user.esAdmin) {
    return res.status(403).json({ error: 'Acceso solo para administradores' });
  }
  next();
};

module.exports = { isAdmin };
