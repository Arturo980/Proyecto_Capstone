import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_BASE_URL } from '../assets/Configuration/config';
import '../styles/MediaPage.css';
import '../styles/Teams.css';
import avatarGenerico from '../assets/images/avatar-generico.jpg';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const PlayerDetailPage = ({ language }) => {
  const { leagueParam, teamParam, playerIndex } = useParams();
  const [player, setPlayer] = useState(null);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        setLoading(true);
        
        const decodedTeamParam = decodeURIComponent(teamParam);
        const decodedLeagueParam = decodeURIComponent(leagueParam);
        let foundTeam = null;
        let actualLeagueId = leagueParam;
        
        // Primero verificar si leagueParam es un ID válido, si no, buscar por código o nombre
        const isValidLeagueId = /^[0-9a-fA-F]{24}$/.test(leagueParam);
        if (!isValidLeagueId) {
          // Buscar liga por código o por nombre para obtener el ID
          const leagueRes = await fetch(`${API_BASE_URL}/api/leagues`);
          const leagueData = await leagueRes.json();
          
          // Primero buscar por código (preferido)
          let foundLeague = leagueData.find(l => l.code === decodedLeagueParam.toUpperCase());
          
          // Si no se encuentra por código, buscar por nombre (compatibilidad hacia atrás)
          if (!foundLeague) {
            foundLeague = leagueData.find(l => l.name === decodedLeagueParam);
          }
          
          if (foundLeague) {
            actualLeagueId = foundLeague._id;
          }
        }
        
        // Buscar el equipo
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(teamParam);
        
        if (isValidObjectId) {
          // Buscar por ID específico
          const url = `${API_BASE_URL}/api/teams?teamId=${teamParam}`;
          const res = await fetch(url);
          const data = await res.json();
          
          if (Array.isArray(data.teams) && data.teams.length > 0) {
            foundTeam = data.teams[0];
          }
        } else {
          // Buscar por abreviación o nombre
          let url = `${API_BASE_URL}/api/teams?league=${actualLeagueId}&abbr=${decodedTeamParam}`;
          let res = await fetch(url);
          let data = await res.json();
          
          if (Array.isArray(data.teams) && data.teams.length > 0) {
            foundTeam = data.teams[0];
          } else {
            // Si no encuentra por abbr, buscar por nombre
            url = `${API_BASE_URL}/api/teams?league=${actualLeagueId}`;
            res = await fetch(url);
            data = await res.json();
            
            if (Array.isArray(data.teams) && data.teams.length > 0) {
              foundTeam = data.teams.find(team => 
                team.name === decodedTeamParam || 
                team.name === teamParam
              );
            }
          }
        }
        
        setTeam(foundTeam);
        
        // Obtener el jugador por índice
        if (foundTeam && foundTeam.roster && foundTeam.roster[playerIndex]) {
          setPlayer(foundTeam.roster[playerIndex]);
        }
        
      } catch (error) {
        console.error('Error fetching player data:', error);
      }
      setLoading(false);
    };

    if (leagueParam && teamParam && playerIndex !== undefined) {
      fetchPlayerData();
    }
  }, [leagueParam, teamParam, playerIndex]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!player || !team) {
    return (
      <div className="player-detail-page-wrapper" style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
        <div className="container mt-5" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Link to={`/teams/${leagueParam}/${teamParam}`} className="btn btn-secondary mb-3">
            {language === 'en' ? 'Back to Team' : 'Volver al Equipo'}
          </Link>
          <div className="empty-state-container" style={{ flex: 1 }}>
            <EmptyState
              icon="❌"
              title={language === 'en' ? 'Player Not Found' : 'Jugador No Encontrado'}
              description={
                language === 'en' 
                  ? 'The player you are looking for does not exist.' 
                  : 'El jugador que buscas no existe.'
              }
              language={language}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="player-detail-page-wrapper" style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
      <div className="container mt-5" style={{ flex: 1 }}>
        <Link to={`/teams/${leagueParam}/${teamParam}`} className="btn btn-secondary mb-3">
          {language === 'en' ? 'Back to Team' : 'Volver al Equipo'}
        </Link>
        
        <div className="row">
          {/* Información del jugador */}
          <div className="col-md-4">
            <div className="card player-info-card">
              <div className="card-body text-center">
                <div className="player-image-large mb-3">
                  <img
                    src={player.image || avatarGenerico}
                    alt={player.name}
                    className="img-fluid"
                    style={{
                      width: '200px',
                      height: '200px',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
                <h3 className="player-name-large">{player.name}</h3>
                <p className="text-muted mb-1">{team.name}</p>
                
                <div className="player-basic-info mt-4">
                  <div className="info-row">
                    <strong>{language === 'en' ? 'Position:' : 'Posición:'}</strong>
                    <span className="ms-2">{player.position || (language === 'en' ? 'Not specified' : 'No especificada')}</span>
                  </div>
                  
                  {player.age && (
                    <div className="info-row">
                      <strong>{language === 'en' ? 'Age:' : 'Edad:'}</strong>
                      <span className="ms-2">{player.age} {language === 'en' ? 'years' : 'años'}</span>
                    </div>
                  )}
                  
                  {player.height && (
                    <div className="info-row">
                      <strong>{language === 'en' ? 'Height:' : 'Estatura:'}</strong>
                      <span className="ms-2">{player.height}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Estadísticas del jugador */}
          <div className="col-md-8">
            <div className="card stats-card">
              <div className="card-header">
                <h4>{language === 'en' ? 'Player Statistics' : 'Estadísticas del Jugador'}</h4>
              </div>
              <div className="card-body">
                {player.stats ? (
                  <div className="row">
                    <div className="col-md-6">
                      <div className="stat-item">
                        <span className="stat-label">{language === 'en' ? 'Aces per Set:' : 'Aces por Set:'}</span>
                        <span className="stat-value">{player.stats.acesPerSet || 0}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">{language === 'en' ? 'Assists per Set:' : 'Asistencias por Set:'}</span>
                        <span className="stat-value">{player.stats.assistsPerSet || 0}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">{language === 'en' ? 'Attacks per Set:' : 'Ataques por Set:'}</span>
                        <span className="stat-value">{player.stats.attacksPerSet || 0}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">{language === 'en' ? 'Blocks per Set:' : 'Bloqueos por Set:'}</span>
                        <span className="stat-value">{player.stats.blocksPerSet || 0}</span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="stat-item">
                        <span className="stat-label">{language === 'en' ? 'Digs per Set:' : 'Defensas por Set:'}</span>
                        <span className="stat-value">{player.stats.digsPerSet || 0}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">{language === 'en' ? 'Hitting Percentage:' : 'Porcentaje de Ataque:'}</span>
                        <span className="stat-value">{player.stats.hittingPercentage || 0}%</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">{language === 'en' ? 'Kills per Set:' : 'Remates por Set:'}</span>
                        <span className="stat-value">{player.stats.killsPerSet || 0}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">{language === 'en' ? 'Points per Set:' : 'Puntos por Set:'}</span>
                        <span className="stat-value">{player.stats.pointsPerSet || 0}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon="📊"
                    title={language === 'en' ? 'No Statistics Available' : 'Sin Estadísticas Disponibles'}
                    description={
                      language === 'en' 
                        ? 'This player does not have statistics recorded yet.' 
                        : 'Este jugador aún no tiene estadísticas registradas.'
                    }
                    language={language}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerDetailPage;
