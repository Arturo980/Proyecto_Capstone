import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_BASE_URL } from '../assets/Configuration/config';
import '../styles/MediaPage.css';
import '../styles/Teams.css';
import avatarGenerico from '../assets/images/avatar-generico.jpg';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const TeamDetailPage = ({ language }) => {
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchTeam();
  }, [teamId]);

  const fetchTeam = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/teams?teamId=${teamId}`);
      const data = await res.json();
      // Si el backend soporta buscar por ID, usa el primer resultado
      if (Array.isArray(data.teams)) {
        setTeam(data.teams.find(t => t._id === teamId) || null);
      } else {
        setTeam(null);
      }
    } catch (error) {
      console.error('Error fetching team:', error);
      setTeam(null);
    }
    setLoading(false);
  };

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
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 style={{ textAlign: 'center', marginBottom: 0 }}>{team.name}</h2>
      </div>
      <div className="row justify-content-center">
        {Array.isArray(team.roster) && team.roster.length > 0 ? (
          <div className="row" style={{ maxWidth: 1200, margin: '0 auto' }}>
            {team.roster.map((player, idx) => (
              <div key={idx} className="col-6 col-sm-4 col-md-3 col-lg-2 mb-4 d-flex flex-column align-items-center">
                <div className="player-image-container">
                  <img
                    src={
                      (typeof player === 'object' && player.image) 
                        ? player.image 
                        : avatarGenerico
                    }
                    alt="avatar"
                    className="player-image"
                  />
                </div>
                <div className="player-name">
                  {typeof player === 'string' ? player : player.name}
                  {typeof player === 'object' && (player.age || player.rut) && (
                    <div style={{ fontSize: '12px', fontWeight: 'normal', color: '#666', marginTop: '4px' }}>
                      {player.age && `${player.age} ${language === 'en' ? 'years' : 'años'}`}
                      {player.age && player.rut && ' • '}
                      {player.rut}
                    </div>
                  )}
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
