// Validar variables de entorno críticas
const validateEnv = () => {
  const requiredEnvVars = ['MONGO_URI'];
  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingEnvVars.length > 0) {
    console.error('❌ Variables de entorno faltantes:', missingEnvVars.join(', '));
    console.error('🔧 Asegúrate de que estas variables estén configuradas en tu archivo .env o en Render');
    process.exit(1);
  }
};

module.exports = { validateEnv };
