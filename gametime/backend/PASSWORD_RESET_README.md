# Sistema de Recuperación de Contraseña - GameTime

Este documento describe cómo configurar y usar el sistema de recuperación de contraseña implementado en GameTime.

## 🔧 Configuración

### 1. Variables de Entorno (Backend)

Agrega las siguientes variables a tu archivo `.env` en el backend:

```env
# SMTP Configuration for Email (password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_contraseña_de_aplicacion

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 2. Configuración de Gmail para SMTP

1. **Activar verificación en 2 pasos** en tu cuenta de Gmail
2. **Generar una contraseña de aplicación**:
   - Ve a tu cuenta de Google
   - Seguridad → Verificación en 2 pasos → Contraseñas de aplicaciones
   - Genera una nueva contraseña de aplicación para "GameTime"
   - Usa esta contraseña en `SMTP_PASS`

### 3. Otros proveedores de email

Si prefieres usar otro proveedor, actualiza estas variables:

```env
# Para Outlook/Hotmail
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587

# Para Yahoo
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
```

## 🚀 Flujo de Funcionamiento

### 1. Solicitud de Reset (Frontend)
- Usuario va a `/forgot-password`
- Ingresa su email
- Se envía solicitud a `/api/forgot-password`

### 2. Procesamiento (Backend)
- Verifica si el email existe
- Genera token JWT con expiración de 1 hora
- Guarda token en la base de datos
- Envía email con enlace de recuperación

### 3. Reset de Contraseña (Frontend)
- Usuario hace clic en enlace del email
- Va a `/reset-password?token=...`
- Se verifica la validez del token
- Usuario ingresa nueva contraseña
- Se actualiza la contraseña en la base de datos

## 📋 APIs Implementadas

### POST `/api/forgot-password`
**Body:**
```json
{
  "correo": "usuario@email.com"
}
```

**Response:**
```json
{
  "message": "Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña."
}
```

### POST `/api/reset-password`
**Body:**
```json
{
  "token": "jwt_token_here",
  "nuevaContraseña": "nueva_contraseña_123"
}
```

**Response:**
```json
{
  "message": "Contraseña restablecida exitosamente"
}
```

### GET `/api/verify-reset-token/:token`
**Response:**
```json
{
  "valid": true,
  "message": "Token válido"
}
```

## 🔒 Características de Seguridad

1. **Tokens JWT con expiración**: Los tokens expiran en 1 hora
2. **Validación de email**: Se verifica formato de email antes de procesar
3. **Hash de contraseñas**: Las nuevas contraseñas se hashean con bcrypt
4. **Limpieza de tokens**: Los tokens se eliminan después del uso exitoso
5. **No revelación de información**: No se revela si un email existe o no

## 🎨 Páginas Frontend

### `/forgot-password`
- Formulario para ingresar email
- Validación de formato de email
- Mensajes de confirmación y error
- Enlace para volver al login

### `/reset-password`
- Verificación automática del token
- Formulario para nueva contraseña
- Confirmación de contraseña
- Redirección automática al login después del éxito

## 🐛 Solución de Problemas

### Error: "Error enviando email"
- Verifica las credenciales SMTP
- Asegúrate de que la contraseña de aplicación sea correcta
- Verifica que la verificación en 2 pasos esté activada

### Error: "Token inválido o expirado"
- El token puede haber expirado (>1 hora)
- El token puede ser inválido
- Solicita un nuevo enlace de recuperación

### Email no llega
- Revisa la carpeta de spam
- Verifica que el email esté correctamente configurado
- Revisa los logs del servidor para errores SMTP

## 📝 Notas Adicionales

- Los emails se envían en formato HTML con diseño responsive
- El sistema es compatible con dispositivos móviles
- Los textos están en español
- Se incluye validación tanto en frontend como backend
- El sistema maneja errores de conexión y timeouts

## 🔄 Actualizaciones del Modelo de Usuario

Se agregaron los siguientes campos al esquema de Usuario:

```javascript
resetPasswordToken: { type: String }, // Token para reset de contraseña
resetPasswordExpires: { type: Date }, // Fecha de expiración del token
```

Estos campos se limpian automáticamente después de un reset exitoso.
