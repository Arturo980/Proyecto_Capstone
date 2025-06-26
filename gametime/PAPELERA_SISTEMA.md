# Sistema de Papelera de Reciclaje - GameTime

## Descripción General

El sistema de papelera de reciclaje permite que los elementos eliminados (equipos, partidos, ligas, imágenes, noticias) sean enviados a una papelera temporal por 15 días antes de ser eliminados permanentemente.

## Características

### ✨ Funcionalidades Principales

- **Eliminación Diferida**: Los elementos no se eliminan inmediatamente, se envían a papelera
- **Período de Gracia**: 15 días para restaurar elementos antes de eliminación permanente
- **Limpieza Automática**: Sistema automático que elimina elementos expirados cada 24 horas
- **Restauración**: Posibilidad de restaurar elementos desde la papelera
- **Eliminación Manual**: Los administradores pueden eliminar permanentemente antes del período de gracia
- **Alertas Visuales**: Elementos que expiran pronto (≤3 días) se destacan en amarillo

### 🔧 Componentes Técnicos

#### Backend

1. **Modelo AuditLog Mejorado** (`models/AuditLog.js`)
   - Campos agregados: `isInTrash`, `scheduledDeletion`, `deletedAt`, `isPermanentlyDeleted`
   - Índices optimizados para consultas de limpieza

2. **Controlador de Auditoría** (`controllers/auditController.js`)
   - `sendToTrash()`: Envía elementos a papelera
   - `cleanupExpiredTrashItems()`: Limpieza automática de elementos expirados
   - `permanentDelete()`: Eliminación permanente manual
   - `restoreEntity()`: Restauración de elementos

3. **Rutas Actualizadas** (`routes/audit.js`)
   - `DELETE /permanent/:entity/:id`: Eliminación permanente
   - `GET /audit-log`: Lista elementos en papelera

4. **Controladores Actualizados**
   - `teamController.js`: Usa `sendToTrash()` en lugar de eliminación directa
   - `gameController.js`: Implementa sistema de papelera
   - *Otros controladores pueden ser actualizados de manera similar*

#### Frontend

1. **AdminAuditPage Renovada** (`pages/AdminAuditPage.js`)
   - Interfaz de papelera de reciclaje
   - Muestra días restantes hasta eliminación
   - Botones de restaurar y eliminar permanentemente
   - Alertas visuales para elementos que expiran pronto

2. **CloudinaryUpload Mejorado** (`components/CloudinaryUpload.js`)
   - Parámetro `showPreview` para controlar duplicación de imágenes
   - Previene duplicación de vista previa en NewsEditorPage

### 🚀 Funcionalidades de Limpieza Automática

#### Programación Automática

El servidor ejecuta limpieza automática:
- **Al iniciar**: 5 segundos después del arranque
- **Periódicamente**: Cada 24 horas
- **Por consulta**: Cada vez que se accede a `/api/audit-log`

#### Script Manual

```bash
# Ejecutar limpieza manual
node backend/jobs/cleanup.js
```

### 📊 Flujo de Eliminación

```
1. Usuario elimina elemento
   ↓
2. Elemento se envía a papelera
   ↓
3. Se programa eliminación para +15 días
   ↓
4. Durante 15 días: elemento puede ser restaurado
   ↓
5. Después de 15 días: eliminación automática permanente
```

### 🎯 Uso de la Papelera

#### Para Administradores

1. **Acceder a la papelera**: Navegar a `/admin/auditoria`
2. **Ver elementos**: Lista con fecha de eliminación y días restantes
3. **Restaurar**: Botón verde "Restaurar" para recuperar elementos
4. **Eliminar permanentemente**: Botón rojo "Eliminar Definitivamente"
5. **Alertas**: Elementos en amarillo expiran en ≤3 días

#### Para Desarrolladores

```javascript
// Enviar elemento a papelera
const { sendToTrash } = require('./controllers/auditController');
await sendToTrash('entity_type', 'entity_id', dataObject, userEmail);

// Limpiar elementos expirados
const { cleanupExpiredTrashItems } = require('./controllers/auditController');
await cleanupExpiredTrashItems();
```

### 🔒 Seguridad

- Solo administradores pueden acceder a la papelera
- Confirmación requerida para eliminación permanente
- Logs de auditoría para todas las acciones
- Registro del usuario que realizó cada acción

### ⚡ Rendimiento

- Índices optimizados en MongoDB para consultas de limpieza
- Limpieza por lotes para mejor rendimiento
- Límite de 200 elementos mostrados en la interfaz

### 🐛 Monitoreo y Logs

El servidor registra:
- ✅ Limpieza automática exitosa
- ❌ Errores en limpieza
- 🗑️ Elementos enviados a papelera
- 🔄 Elementos restaurados
- ⚠️ Elementos eliminados permanentemente

### 📝 Próximas Mejoras

- [ ] Notificaciones por email antes de eliminación permanente
- [ ] Dashboard de estadísticas de papelera
- [ ] Configuración de período de retención personalizable
- [ ] Búsqueda y filtros en papelera
- [ ] Restauración masiva de elementos

---

**Nota**: El sistema mantiene compatibilidad con funcionalidades existentes mientras agrega la capa de seguridad de papelera de reciclaje.
