import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../assets/Configuration/config';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';

// Cambia el endpoint para que apunte a /api/audit-log
const API_AUDIT_LOG = `${API_BASE_URL}/api/audit-log`;
const API_RESTORE = `${API_BASE_URL}/api/restore`;
const API_PERMANENT_DELETE = `${API_BASE_URL}/api/permanent`;

const entityLabels = {
  team: 'Equipo',
  league: 'Liga',
  game: 'Partido',
  image: 'Imagen',
  news: 'Noticia'
};

const AdminAuditPage = ({ language }) => {
  const [logs, setLogs] = useState([]);
  const [restoring, setRestoring] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [restoredIds, setRestoredIds] = useState(new Set());
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setError(null);
    try {
      const res = await fetch(API_AUDIT_LOG);
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setLogs(data.logs || []);
      // Marca como restaurados los que ya tienen una acción de restore para ese entityId
      const restoredSet = new Set();
      (data.logs || []).forEach(log => {
        if (log.action === 'restore') {
          restoredSet.add(`${log.entity}:${log.entityId}`);
        }
      });
      setRestoredIds(restoredSet);
    } catch (err) {
      setLogs([]);
      setError(
        "No se pudo cargar la papelera. " +
        "Verifica que el endpoint '/api/audit-log' exista en el backend. " +
        "Detalle: " + err.message
      );
    }
  };

  const handleRestore = async (entity, id) => {
    setRestoring(id);
    try {
      const res = await fetch(`${API_RESTORE}/${entity}/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-email': JSON.parse(localStorage.getItem('user'))?.correo || 'admin'
        }
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(`Error ${res.status}: ${errorData.error || res.statusText}`);
      }
      
      setRestoredIds(prev => new Set(prev).add(`${entity}:${id}`));
      await fetchLogs(); // Recargar para actualizar la lista
    } catch (err) {
      console.error('Error al restaurar:', err);
      alert(`Error al restaurar: ${err.message}`);
    }
    setRestoring(null);
  };

  const handlePermanentDelete = async (entity, id) => {
    const entityLabel = entityLabels[entity] || entity;
    setItemToDelete({ entity, id, label: entityLabel });
    setShowConfirmModal(true);
  };

  const confirmPermanentDelete = async () => {
    if (!itemToDelete) return;

    const { entity, id } = itemToDelete;
    setDeleting(id);
    try {
      const res = await fetch(`${API_PERMANENT_DELETE}/${entity}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'user-email': JSON.parse(localStorage.getItem('user'))?.correo || 'admin'
        }
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(`Error ${res.status}: ${errorData.error || res.statusText}`);
      }
      
      await fetchLogs(); // Recargar para actualizar la lista
    } catch (err) {
      console.error('Error al eliminar permanentemente:', err);
      alert(`Error al eliminar permanentemente: ${err.message}`);
    }
    setDeleting(null);
    setShowConfirmModal(false);
    setItemToDelete(null);
  };

  const getDaysRemaining = (scheduledDeletion) => {
    if (!scheduledDeletion) return 'N/A';
    const now = new Date();
    const scheduled = new Date(scheduledDeletion);
    const diffTime = scheduled - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="full-page-container">
      <div className="container">
        <h2>{language === 'en' ? 'Trash / Recycle Bin' : 'Papelera de Reciclaje'}</h2>
      <p className="text-muted">
        {language === 'en' 
          ? 'Items deleted from the system are stored here for 15 days before permanent deletion.'
          : 'Los elementos eliminados del sistema se almacenan aquí por 15 días antes de la eliminación definitiva.'}
      </p>
      {error && (
        <div className="alert alert-danger" role="alert" style={{ maxWidth: 600 }}>
          {error}
        </div>
      )}
      {logs.length === 0 && !error ? (
        <EmptyState
          icon="🗑️"
          title={language === 'en' ? 'Trash is Empty' : 'Papelera Vacía'}
          description={
            language === 'en' 
              ? 'No deleted items are currently in the trash.' 
              : 'No hay elementos eliminados en la papelera actualmente.'
          }
          language={language}
        />
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-hover align-middle">
            <thead>
              <tr>
                <th>{language === 'en' ? 'Deleted Date' : 'Fecha de Eliminación'}</th>
                <th>{language === 'en' ? 'Entity Type' : 'Tipo de Entidad'}</th>
                <th>{language === 'en' ? 'User' : 'Usuario'}</th>
                <th>{language === 'en' ? 'Days Remaining' : 'Días Restantes'}</th>
                <th>{language === 'en' ? 'Data' : 'Datos'}</th>
                <th>{language === 'en' ? 'Actions' : 'Acciones'}</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => {
                const daysRemaining = getDaysRemaining(log.scheduledDeletion);
                const isExpiringSoon = daysRemaining <= 3;
                
                return (
                  <tr key={log._id} className={isExpiringSoon ? 'table-warning' : ''}>
                    <td>{new Date(log.deletedAt || log.timestamp).toLocaleString()}</td>
                    <td>{entityLabels[log.entity] || log.entity}</td>
                    <td>{log.user}</td>
                    <td>
                      <span className={isExpiringSoon ? 'text-danger fw-bold' : ''}>
                        {daysRemaining} {language === 'en' ? 'days' : 'días'}
                        {isExpiringSoon && (
                          <small className="d-block text-danger">
                            {language === 'en' ? 'Expires soon!' : '¡Expira pronto!'}
                          </small>
                        )}
                      </span>
                    </td>
                    <td>
                      <details>
                        <summary>
                          {language === 'en' ? 'View data' : 'Ver datos'}
                        </summary>
                        <pre style={{ maxWidth: 300, maxHeight: 120, overflow: 'auto', fontSize: 12, marginTop: 8 }}>
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </details>
                    </td>
                    <td>
                      <div className="d-flex gap-2 flex-wrap">
                        {!restoredIds.has(`${log.entity}:${log.entityId}`) && (
                          <button
                            className="btn btn-success btn-sm"
                            disabled={restoring === log.entityId}
                            onClick={() => handleRestore(log.entity, log.entityId)}
                          >
                            {restoring === log.entityId 
                              ? (language === 'en' ? 'Restoring...' : 'Restaurando...') 
                              : (language === 'en' ? 'Restore' : 'Restaurar')}
                          </button>
                        )}
                        <button
                          className="btn btn-danger btn-sm"
                          disabled={deleting === log.entityId}
                          onClick={() => handlePermanentDelete(log.entity, log.entityId)}
                        >
                          {deleting === log.entityId 
                            ? (language === 'en' ? 'Deleting...' : 'Eliminando...') 
                            : (language === 'en' ? 'Delete Forever' : 'Eliminar Definitivamente')}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {logs.length > 0 && (
        <div className="mt-3">
          <small className="text-muted">
            {language === 'en' 
              ? 'Items highlighted in yellow will be automatically deleted in 3 days or less.'
              : 'Los elementos resaltados en amarillo se eliminarán automáticamente en 3 días o menos.'}
          </small>
        </div>
      )}
      
      {/* Modal de confirmación para eliminar permanentemente */}
      <ConfirmModal
        show={showConfirmModal}
        onHide={() => {
          setShowConfirmModal(false);
          setItemToDelete(null);
        }}
        onConfirm={confirmPermanentDelete}
        title={language === 'en' ? 'Permanent Deletion' : 'Eliminación Permanente'}
        message={
          itemToDelete 
            ? (language === 'en' 
                ? `Are you sure you want to permanently delete this ${itemToDelete.label}? This action cannot be undone.`
                : `¿Estás seguro de eliminar permanentemente este ${itemToDelete.label}? Esta acción no se puede deshacer.`)
            : ''
        }
        confirmText={language === 'en' ? 'Delete Permanently' : 'Eliminar Definitivamente'}
        cancelText={language === 'en' ? 'Cancel' : 'Cancelar'}
        confirmVariant="danger"
      />
      </div>
    </div>
  );
};

export default AdminAuditPage;
