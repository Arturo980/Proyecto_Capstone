import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../assets/Configuration/config';
import EmptyState from '../components/EmptyState';

const AdminSolicitudes = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accion, setAccion] = useState({}); // Para mostrar feedback por usuario
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.esAdmin) {
      navigate('/'); // Redirige a home si no es admin
    }
  }, [navigate]);

  const fetchSolicitudes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/solicitudes-pendientes`);
      const data = await res.json();
      setSolicitudes(data);
    } catch (err) {
      setSolicitudes([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  const handleAccion = async (id, tipo) => {
    setAccion({ ...accion, [id]: 'loading' });
    try {
      const res = await fetch(
        `${API_BASE_URL}/${tipo === 'aprobar' ? 'aprobar-usuario' : 'rechazar-usuario'}/${id}`,
        { method: 'POST' }
      );
      const data = await res.json();
      setAccion({ ...accion, [id]: data.message });
      // Refresca la lista después de la acción
      setTimeout(() => {
        fetchSolicitudes();
        setAccion((prev) => {
          const nuevo = { ...prev };
          delete nuevo[id];
          return nuevo;
        });
      }, 1000);
    } catch (err) {
      setAccion({ ...accion, [id]: 'Error' });
    }
  };

  return (
    <div className="full-page-container">
      <div style={{ maxWidth: 700, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 10, boxShadow: '0 2px 12px #0001' }}>
      <h2>Solicitudes de Registro</h2>
      {loading ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          fontSize: '1.1rem',
          color: '#666'
        }}>
          <div className="spinner-border text-primary me-3" role="status"></div>
          Cargando solicitudes...
        </div>
      ) : solicitudes.length === 0 ? (
        <EmptyState 
          icon="✅"
          title="¡Todo al día!"
          description="No hay solicitudes de registro pendientes en este momento. Todas las solicitudes han sido procesadas."
        />
      ) : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Tipo de Cuenta</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {solicitudes.map((usuario) => (
              <tr key={usuario._id}>
                <td>{usuario.nombre}</td>
                <td>{usuario.correo}</td>
                <td>
                  {usuario.tipoCuenta === 'match-manager'
                    ? 'Gestor de Partido'
                    : usuario.tipoCuenta === 'content-editor'
                    ? 'Editor de Contenido'
                    : usuario.tipoCuenta}
                </td>
                <td>
                  <button
                    className="btn btn-success btn-sm me-2"
                    style={{ marginBottom: 8 }}
                    disabled={accion[usuario._id] === 'loading'}
                    onClick={() => handleAccion(usuario._id, 'aprobar')}
                  >
                    Aprobar
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    style={{ marginBottom: 0}}
                    disabled={accion[usuario._id] === 'loading'}
                    onClick={() => handleAccion(usuario._id, 'rechazar')}
                  >
                    Rechazar
                  </button>
                  {accion[usuario._id] && accion[usuario._id] !== 'loading' && (
                    <span className="ms-2">{accion[usuario._id]}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      </div>
    </div>
  );
};

export default AdminSolicitudes;
