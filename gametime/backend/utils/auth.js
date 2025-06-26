// Función auxiliar para obtener email del usuario (placeholder para auditoría)
function getUserEmailFromRequest(req) {
  // Aquí podrías implementar la lógica para obtener el email del usuario autenticado
  // Por ahora retorna un placeholder
  return req.headers['user-email'] || 'usuario-anonimo';
}

module.exports = { getUserEmailFromRequest };
