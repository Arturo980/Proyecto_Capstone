// Middleware para verificar si el usuario es admin
const isAdmin = async (req, res, next) => {
  try {
    // El usuario debe estar autenticado y ser admin
    // Buscar información del usuario desde varios lugares posibles
    let user = req.user || req.body.user;
    
    // Si no hay usuario en el request, intentar obtenerlo del header user-email
    if (!user) {
      const userEmail = req.headers['user-email'] || req.headers['x-user-email'];
      if (userEmail && userEmail !== 'usuario-anonimo') {
        // Aquí podrías hacer una consulta a la base de datos para obtener el usuario completo
        // Por ahora, asumimos que si viene el header es admin (esto debería mejorarse en producción)
        const { Usuario } = require('../models');
        const dbUser = await Usuario.findOne({ correo: userEmail });
        if (dbUser) {
          user = dbUser;
          req.user = dbUser; // Guardarlo en req.user para uso posterior
        }
      }
    }
    
    if (!user || !user.esAdmin) {
      return res.status(403).json({ error: 'Acceso solo para administradores' });
    }
    
    next();
  } catch (error) {
    console.error('Error en middleware isAdmin:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { isAdmin };
