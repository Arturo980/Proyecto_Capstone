import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../assets/Configuration/config';

// Cambia el endpoint para que apunte a /api/audit-log
const API_AUDIT_LOG = `${API_BASE_URL}/api/audit-log`;
const API_RESTORE = `${API_BASE_URL}/restore`;

const entityLabels = {
  team: 'Equipo',
  league: 'Liga',
  game: 'Partido',
  image: 'Imagen'
};

const AdminAuditPage = ({ language }) => {
  const [logs, setLogs] = useState([]);
  const [restoring, setRestoring] = useState(null);
  const [restoredIds, setRestoredIds] = useState(new Set());
  const [error, setError] = useState(null);

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
        "No se pudo cargar la auditoría. " +
        "Verifica que el endpoint '/api/audit-log' exista en el backend. " +
        "Detalle: " + err.message
      );
    }
  };

  const handleRestore = async (entity, id) => {
    setRestoring(id);
    setRestoredIds(prev => new Set(prev).add(`${entity}:${id}`));
    await fetch(`${API_RESTORE}/${entity}/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': JSON.parse(localStorage.getItem('user'))?.correo || 'admin'
      }
    });
    setRestoring(null);
    // fetchLogs(); // Opcional
  };

  return (
    <div className="container mt-5">
      <h2>Auditoría y Restauración</h2>
      {error && (
        <div className="alert alert-danger" role="alert" style={{ maxWidth: 600 }}>
          {error}
        </div>
      )}
      <div className="table-responsive">
        <table className="table table-bordered table-hover align-middle">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Acción</th>
              <th>Entidad</th>
              <th>Usuario</th>
              <th>Datos</th>
              <th>Restaurar</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log._id}>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
                <td>{log.action}</td>
                <td>{entityLabels[log.entity] || log.entity}</td>
                <td>{log.user}</td>
                <td>
                  <pre style={{ maxWidth: 300, maxHeight: 120, overflow: 'auto', fontSize: 12 }}>
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                </td>
                <td>
                  {!restoredIds.has(`${log.entity}:${log.entityId}`) && (
                    <button
                      className="btn btn-success btn-sm"
                      disabled={restoring === log.entityId}
                      onClick={() => handleRestore(log.entity, log.entityId)}
                    >
                      Restaurar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminAuditPage;
