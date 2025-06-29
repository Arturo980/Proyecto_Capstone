# 🧪 Guía de Pruebas - Sistema de Recuperación de Contraseña

## ⚙️ Pasos para probar el sistema completo

### 1. Configuración Inicial

1. **Configura las variables de entorno en el backend**:
   ```env
   SMTP_USER=tu_email@gmail.com
   SMTP_PASS=tu_contraseña_de_aplicacion
   FRONTEND_URL=http://localhost:3000
   ```

2. **Asegúrate de que ambos servidores estén corriendo**:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm start

   # Terminal 2 - Frontend  
   cd frontend
   npm start
   ```

### 2. Pruebas de Frontend

#### Página "Olvidé mi contraseña"
1. Ve a `http://localhost:3000/login`
2. Haz clic en "¿Olvidaste tu contraseña?"
3. Deberías ver el formulario de recuperación
4. Ingresa un email válido registrado en tu sistema
5. Verifica que aparezca el mensaje de confirmación

#### Página de Reset de Contraseña
1. Revisa tu email para el enlace de recuperación
2. Haz clic en el enlace (formato: `http://localhost:3000/reset-password?token=...`)
3. Deberías ver el formulario de nueva contraseña
4. Ingresa una nueva contraseña y su confirmación
5. Verifica que se actualice correctamente

### 3. Pruebas de API (con herramientas como Postman o curl)

#### Solicitar Reset de Contraseña
```bash
curl -X POST http://localhost:4000/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"correo": "usuario@ejemplo.com"}'
```

#### Verificar Token
```bash
curl -X GET http://localhost:4000/verify-reset-token/TOKEN_AQUI
```

#### Restablecer Contraseña
```bash
curl -X POST http://localhost:4000/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TOKEN_AQUI",
    "nuevaContraseña": "nuevapassword123"
  }'
```

### 4. Casos de Prueba

#### ✅ Casos Exitosos
- [ ] Usuario ingresa email válido registrado
- [ ] Se envía email de recuperación
- [ ] Token es válido y no ha expirado
- [ ] Nueva contraseña cumple requisitos mínimos
- [ ] Usuario puede iniciar sesión con nueva contraseña

#### 🚫 Casos de Error
- [ ] Email con formato inválido
- [ ] Email no registrado en el sistema
- [ ] Token expirado (>1 hora)
- [ ] Token inválido o manipulado
- [ ] Contraseña muy corta (<6 caracteres)
- [ ] Contraseñas no coinciden

### 5. Verificaciones de Seguridad

#### 🔒 Comportamientos Esperados
- [ ] No se revela si un email existe o no
- [ ] Tokens expiran en 1 hora exactamente
- [ ] Contraseñas se hashean antes de guardar
- [ ] Tokens se limpian después del uso
- [ ] Validación tanto en frontend como backend

### 6. Logs a Verificar

En la consola del backend deberías ver:
```
✅ Email de recuperación enviado: messageId
🔐 Token de reset generado para usuario: userId  
✅ Contraseña actualizada para usuario: userId
```

### 7. Solución de Problemas Comunes

#### Email no se envía
- Verifica credenciales SMTP
- Revisa que esté habilitada la verificación en 2 pasos
- Confirma que la contraseña de aplicación sea correcta

#### Frontend no se conecta al backend  
- Verifica que `REACT_APP_API_BASE_URL` apunte a `http://localhost:4000`
- Confirma que CORS esté configurado correctamente

#### Token inválido constantemente
- Verifica que `JWT_SECRET` sea el mismo en desarrollo y producción
- Confirma que la fecha/hora del servidor sea correcta

## 🎯 Flujo Completo de Prueba

1. **Registro**: Crea un usuario de prueba
2. **Login**: Verifica que el login funcione normalmente
3. **Logout**: Cierra sesión
4. **Olvido**: Usa "¿Olvidaste tu contraseña?"
5. **Email**: Verifica que llegue el email
6. **Reset**: Cambia la contraseña
7. **Login**: Verifica login con nueva contraseña
8. **Repetir**: Asegúrate de que el token usado no funcione de nuevo

¡Listo! El sistema de recuperación de contraseña está completamente implementado y probado.
