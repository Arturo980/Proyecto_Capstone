const { cleanupExpiredTrashItems } = require('../controllers/auditController');

// Función para ejecutar limpieza automática
const runCleanup = async () => {
  console.log('Iniciando limpieza automática de papelera...');
  try {
    await cleanupExpiredTrashItems();
    console.log('Limpieza automática completada exitosamente');
  } catch (error) {
    console.error('Error en limpieza automática:', error);
  }
};

// Si se ejecuta directamente (node cleanup.js)
if (require.main === module) {
  runCleanup().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Error fatal en limpieza:', error);
    process.exit(1);
  });
}

module.exports = { runCleanup };
