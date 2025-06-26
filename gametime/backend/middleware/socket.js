// Middleware para inyectar socket.io en las rutas
const socketMiddleware = (io) => {
  return (req, res, next) => {
    req.io = io;
    next();
  };
};

module.exports = socketMiddleware;
