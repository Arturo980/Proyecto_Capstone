# GameTime Backend - Solución de Problemas MongoDB Atlas

## Error de Conexión en Render

Si ves el error `MongooseServerSelectionError` con problemas SSL/TLS al desplegar en Render, o errores como `option buffermaxentries is not supported`, sigue estos pasos:

### Errores Comunes y Soluciones

#### 1. Error "option buffermaxentries is not supported"
Este error ocurre cuando se usan opciones deprecadas de MongoDB. El backend ya está actualizado con las opciones correctas.

#### 2. Error SSL/TLS "tlsv1 alert internal error" 
Generalmente se soluciona con la configuración de IP whitelist en MongoDB Atlas.

### 1. Verificar Variables de Entorno

Asegúrate de que estas variables estén configuradas en Render:

```bash
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key  
CLOUDINARY_API_SECRET=tu_api_secret
```

### 2. Configurar IP Whitelist en MongoDB Atlas

1. Ve a tu cluster en MongoDB Atlas
2. Navega a **Network Access**
3. Agrega la IP `0.0.0.0/0` para permitir conexiones desde cualquier IP
   - **Nota**: Esta configuración permite conexiones desde cualquier IP. Para mayor seguridad, puedes obtener las IPs específicas de Render y agregarlas individualmente.

### 3. Verificar Configuración del Cluster

- Asegúrate de que el cluster esté **activo** (no pausado)
- Verifica que el usuario de la base de datos tenga permisos de **lectura y escritura**
- Confirma que la contraseña no contenga caracteres especiales que necesiten escape

### 4. Probar Conexión Localmente

Ejecuta el script de diagnóstico:

```bash
npm run test-mongo
```

### 5. Configuración Adicional para Render

En tu servicio de Render, verifica:

- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Node Version**: 18.x o superior
- **Environment**: Production

### 6. Logs de Diagnóstico

El backend ahora incluye logs mejorados que te ayudarán a identificar el problema:

- ✅ Conexión exitosa
- ❌ Errores de conexión con detalles
- 🔄 Intentos de reconexión automática
- 📊 Estado de variables de entorno

### 7. Troubleshooting Adicional

Si el problema persiste:

1. **Revisa los logs de Render** para ver errores específicos
2. **Verifica la sintaxis del MONGO_URI** - no debe tener espacios ni caracteres extra
3. **Prueba la conexión** desde otra aplicación o herramienta
4. **Contacta el soporte de Render** si el problema persiste

### 8. Configuración de Red en MongoDB Atlas

Para mayor seguridad en producción:

1. Obtén las IPs de salida de Render
2. Reemplaza `0.0.0.0/0` con las IPs específicas
3. Configura un usuario de base de datos específico para producción

### 9. Opciones de Conexión Actualizadas

El backend usa las siguientes opciones de conexión modernas (compatibles con MongoDB 6.0+):

```javascript
{
  serverSelectionTimeoutMS: 30000, // 30 segundos timeout
  socketTimeoutMS: 45000,          // 45 segundos timeout  
  maxPoolSize: 10,                 // Máximo 10 conexiones
  minPoolSize: 2,                  // Mínimo 2 conexiones
  maxIdleTimeMS: 30000,           // Cerrar conexiones inactivas
  retryWrites: true,              // Reintentar escrituras
  w: 'majority'                   // Confirmación de escritura
}
```

**Opciones eliminadas** (ya no compatibles/necesarias):
- `useNewUrlParser` - Ya no necesario en versiones recientes
- `useUnifiedTopology` - Ya no necesario en versiones recientes
- `bufferMaxEntries` - Reemplazado por pool de conexiones
- `ssl/tls` - Se detecta automáticamente desde la URI

### 10. Comandos Útiles

```bash
# Probar conexión local
npm run test-mongo

# Ejecutar en desarrollo
npm run dev

# Ejecutar en producción
npm start
```

### 11. Variables de Entorno Requeridas

Copia `.env.example` a `.env` y configura:

```bash
cp .env.example .env
# Edita .env con tus valores reales
```

## Soporte

Si necesitas ayuda adicional, verifica:
- [Documentación de MongoDB Atlas](https://docs.atlas.mongodb.com/)
- [Documentación de Render](https://render.com/docs)
- [Logs del servidor en tiempo real](https://dashboard.render.com)
