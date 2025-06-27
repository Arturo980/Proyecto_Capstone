import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_BASE_URL } from '../assets/Configuration/config';
import '../styles/MediaPage.css';
import avatarGenerico from '../assets/images/avatar-generico.jpg';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const TeamDetailPage = ({ language }) => {
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetchTeam = async () => {
      const res = await fetch(`${API_BASE_URL}/api/teams?teamId=${teamId}`);
      const data = await res.json();
      // Si el backend soporta buscar por ID, usa el primer resultado
      if (Array.isArray(data.teams)) {
        setTeam(data.teams.find(t => t._id === teamId) || null);
      } else {
        setTeam(null);
      }
      setLoading(false);
    };
    fetchTeam();
  }, [teamId]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!team) {
    return (
      <div className="container mt-5">
        <Link to="/teams" className="btn btn-secondary mb-3">
          {language === 'en' ? 'Back to Teams' : 'Volver a Equipos'}
        </Link>
        <EmptyState
          icon="❌"
          title={language === 'en' ? 'Team Not Found' : 'Equipo No Encontrado'}
          description={
            language === 'en' 
              ? 'The team you are looking for does not exist or has been removed.' 
              : 'El equipo que buscas no existe o ha sido eliminado.'
          }
          language={language}
        />
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <Link to="/teams" className="btn btn-secondary mb-3">
        {language === 'en' ? 'Back to Teams' : 'Volver a Equipos'}
      </Link>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>{team.name}</h2>
      <div className="row justify-content-center">
        {Array.isArray(team.roster) && team.roster.length > 0 ? (
          <div className="row" style={{ maxWidth: 1200, margin: '0 auto' }}>
            {team.roster.map((player, idx) => (
              <div key={idx} className="col-6 col-sm-4 col-md-3 col-lg-2 mb-4 d-flex flex-column align-items-center">
                {/* Aquí podrías mostrar la foto del jugador si la tienes, por ahora solo el nombre */}
                <div
                  style={{
                    width: 120,
                    height: 160,
                    background: '#f5f5f5',
                    borderRadius: 8,
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: 16,
                    color: '#333',
                    border: '1px solid #ddd',
                    overflow: 'hidden', // Para que la imagen no sobresalga
                    padding: 0
                  }}
                >
                  <img
                    src={avatarGenerico}
                    alt="avatar"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: 8,
                      border: 'none',
                      background: '#fff'
                    }}
                  />
                </div>
                <div style={{ textAlign: 'center', fontWeight: 600, fontSize: 14, textTransform: 'uppercase' }}>
                  {typeof player === 'string' ? player : player.name}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="col-12">
            <EmptyState
              icon="👥"
              title={language === 'en' ? 'No Players' : 'Sin Jugadores'}
              description={
                language === 'en' 
                  ? 'This team does not have any players in the roster yet.' 
                  : 'Este equipo aún no tiene jugadores en la plantilla.'
              }
              language={language}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamDetailPage;
