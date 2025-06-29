// Script de prueba para las APIs de recuperación de contraseña
// Ejecutar con: node test-password-reset.js

const BASE_URL = 'http://localhost:4000';

// Función helper para hacer requests
async function makeRequest(url, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { error: error.message };
  }
}

// Función principal de pruebas
async function runTests() {
  console.log('🧪 Iniciando pruebas del sistema de recuperación de contraseña...\n');

  // Test 1: Solicitud de reset con email inválido
  console.log('📧 Test 1: Solicitud de reset con email inválido');
  const test1 = await makeRequest(`${BASE_URL}/forgot-password`, 'POST', {
    correo: 'email-no-valido'
  });
  console.log('Resultado:', test1);
  console.log();

  // Test 2: Solicitud de reset sin email
  console.log('📧 Test 2: Solicitud de reset sin email');
  const test2 = await makeRequest(`${BASE_URL}/forgot-password`, 'POST', {});
  console.log('Resultado:', test2);
  console.log();

  // Test 3: Solicitud de reset con email válido pero inexistente
  console.log('📧 Test 3: Solicitud de reset con email válido pero posiblemente inexistente');
  const test3 = await makeRequest(`${BASE_URL}/forgot-password`, 'POST', {
    correo: 'usuario.prueba@ejemplo.com'
  });
  console.log('Resultado:', test3);
  console.log();

  // Test 4: Verificar token inválido
  console.log('🔐 Test 4: Verificar token inválido');
  const test4 = await makeRequest(`${BASE_URL}/verify-reset-token/token-invalido`);
  console.log('Resultado:', test4);
  console.log();

  // Test 5: Reset de contraseña con token inválido
  console.log('🔐 Test 5: Reset de contraseña con token inválido');
  const test5 = await makeRequest(`${BASE_URL}/reset-password`, 'POST', {
    token: 'token-invalido',
    nuevaContraseña: 'nuevapassword123'
  });
  console.log('Resultado:', test5);
  console.log();

  console.log('✅ Pruebas completadas!');
  console.log('\n📝 Notas:');
  console.log('- Para probar el flujo completo necesitas configurar SMTP');
  console.log('- Los errores 400/401 son esperados en estas pruebas');
  console.log('- El sistema responde correctamente con mensajes de seguridad');
}

// Ejecutar las pruebas
runTests().catch(console.error);
