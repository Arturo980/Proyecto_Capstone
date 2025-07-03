import React, { useEffect, useState } from "react";
import "../styles/HorizontalCarousel.css";
import { API_BASE_URL } from "../assets/Configuration/config.js";
import { io as socketIOClient } from "socket.io-client";

const LEAGUES_URL = `${API_BASE_URL}/api/leagues`;
const GAMES_URL = `${API_BASE_URL}/api/games`;
const TEAMS_URL = `${API_BASE_URL}/api/teams`;
const SOCKET_URL = API_BASE_URL;

const HorizontalGamesCarousel = ({ language = 'es', leagues: externalLeagues = null, appLoading = false }) => {
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState("");
  const [games, setGames] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [publicGameModal, setPublicGameModal] = useState(null);
  const [liveSetScore, setLiveSetScore] = useState({ score1: 0, score2: 0 });
  const [loadingDots, setLoadingDots] = useState(0);

  // Función para formatear fechas según el idioma
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      
      if (language === 'en') {
        // Formato inglés: MM/DD/YYYY
        return date.toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        });
      } else {
        // Formato español: DD/MM/YYYY
        return date.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Animación de puntos para "Cargando..."
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingDots(dots => (dots + 1) % 3);
    }, 500);
    return () => clearInterval(interval);
  }, [loading]);

  // Cargar ligas al montar (solo si no vienen desde props)
  useEffect(() => {
    if (externalLeagues !== null) {
      // Usar ligas desde props
      setLeagues(Array.isArray(externalLeagues) ? externalLeagues : []);
      if (Array.isArray(externalLeagues) && externalLeagues.length > 0) {
        setSelectedLeague(externalLeagues[0]._id);
      } else {
        setSelectedLeague("");
        setLoading(false); // No hay ligas, no hay que cargar nada
      }
      return;
    }

    // Cargar ligas desde API solo si no vienen desde props
    fetch(LEAGUES_URL)
      .then((res) => res.json())
      .then((data) => {
        setLeagues(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) {
          setSelectedLeague(data[0]._id);
        } else {
          setSelectedLeague("");
          setLoading(false); // No hay ligas, no hay que cargar nada
        }
      })
      .catch(() => {
        setLeagues([]);
        setSelectedLeague("");
        setLoading(false); // Error al cargar ligas
      });
  }, [externalLeagues]);

  // Cargar equipos de la liga seleccionada
  useEffect(() => {
    if (!selectedLeague) return;
    fetch(`${TEAMS_URL}?league=${selectedLeague}`)
      .then((res) => res.json())
      .then((data) => {
        setTeams(Array.isArray(data.teams) ? data.teams : []);
      })
      .catch(() => setTeams([]));
  }, [selectedLeague]);

  // Cargar todos los partidos de la liga seleccionada
  useEffect(() => {
    if (!selectedLeague) return;
    setLoading(true);

    let isMounted = true;
    
    fetch(`${GAMES_URL}?league=${selectedLeague}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          const games = Array.isArray(data.games) ? data.games : [];
          setGames(games);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setGames([]);
          setLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, [selectedLeague]);

  // Inicializar socket.io solo una vez
  useEffect(() => {
    const s = socketIOClient(SOCKET_URL, { transports: ['websocket'] });
    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, []);

  // Actualización en tiempo real de partidos por socket.io
  useEffect(() => {
    if (!socket) return;

    // Actualiza marcador simple
    const handleScoreUpdate = ({ gameId, score1, score2, partidoFinalizado }) => {
      setGames(prevGames =>
        prevGames.map(g =>
          g._id === gameId
            ? { ...g, score1, score2, ...(typeof partidoFinalizado === 'boolean' ? { partidoFinalizado } : {}) }
            : g
        )
      );
    };

    // Actualiza historial de sets y estado del partido
    const handleSetsHistoryUpdate = ({ gameId, setsHistory, sets1, sets2, score1, score2, partidoFinalizado }) => {
      setGames(prevGames =>
        prevGames.map(g =>
          g._id === gameId
            ? { ...g, setsHistory, sets1, sets2, score1, score2, partidoFinalizado }
            : g
        )
      );
    };

    // Nuevo: Eliminar partido en tiempo real al recibir el evento game_deleted
    const handleGameDeleted = ({ _id }) => {
      setGames(prevGames => prevGames.filter(g => g._id !== _id));
    };

    // Nuevo: Actualizar partidos en tiempo real cuando se confirmen citados o se cree/actualice un partido
    const handleGameCreatedOrUpdated = () => {
      // Refresca todos los partidos de la liga seleccionada
      if (selectedLeague) {
        fetch(`${GAMES_URL}?league=${selectedLeague}`)
          .then((res) => res.json())
          .then((data) => {
            setGames(Array.isArray(data.games) ? data.games : []);
          });
      }
    };

    socket.on('score_update', handleScoreUpdate);
    socket.on('sets_history_update', handleSetsHistoryUpdate);
    socket.on('game_deleted', handleGameDeleted);
    socket.on('game_created', handleGameCreatedOrUpdated);
    socket.on('game_updated', handleGameCreatedOrUpdated);

    return () => {
      socket.off('score_update', handleScoreUpdate);
      socket.off('sets_history_update', handleSetsHistoryUpdate);
      socket.off('game_deleted', handleGameDeleted);
      socket.off('game_created', handleGameCreatedOrUpdated);
      socket.off('game_updated', handleGameCreatedOrUpdated);
    };
  }, [socket, selectedLeague]);

  // Helper para obtener logo y abbr de un equipo
  const getTeamData = (abbrOrName) => {
    const team = teams.find(
      (t) => t.abbr === abbrOrName || t.name === abbrOrName
    );
    return {
      logo: team?.logo || "",
      abbr: team?.abbr || abbrOrName,
    };
  };

  // Escuchar marcador en vivo del set actual para el modal público
  useEffect(() => {
    if (!publicGameModal || !socket) return;

    // Inicializa con el score actual si el partido está en curso
    if (!publicGameModal.partidoFinalizado) {
      setLiveSetScore({
        score1: typeof publicGameModal.score1 === 'number' ? publicGameModal.score1 : 0,
        score2: typeof publicGameModal.score2 === 'number' ? publicGameModal.score2 : 0,
      });
    }

    // Actualiza el marcador en vivo en el modal aunque cambie por fuera
    const handleSetScoreUpdate = ({ gameId, setScore }) => {
      if (!publicGameModal) return;
      if (publicGameModal.partidoFinalizado) {
        setLiveSetScore({ score1: 0, score2: 0 });
        return;
      }
      if (gameId === publicGameModal._id) {
        setLiveSetScore(setScore);
        setPublicGameModal(prev =>
          prev && prev._id === gameId
            ? { ...prev, score1: setScore.score1, score2: setScore.score2 }
            : prev
        );
      }
    };

    // Actualiza setsHistory y estado del partido en el modal en tiempo real
    const handleSetsHistoryUpdate = ({ gameId, setsHistory, sets1, sets2, score1, score2, partidoFinalizado }) => {
      if (gameId === publicGameModal._id) {
        setPublicGameModal(prev =>
          prev && prev._id === gameId
            ? { ...prev, setsHistory, sets1, sets2, score1, score2, partidoFinalizado }
            : prev
        );
        // Si el partido sigue en curso, actualiza el marcador en vivo al nuevo set (probablemente 0-0)
        if (!partidoFinalizado) {
          setLiveSetScore({
            score1: typeof score1 === 'number' ? score1 : 0,
            score2: typeof score2 === 'number' ? score2 : 0,
          });
        } else {
          setLiveSetScore({ score1: 0, score2: 0 });
        }
      }
    };

    // También escucha score_update para actualizar el modal si cambia el score por socket
    const handleScoreUpdate = ({ gameId, score1, score2, partidoFinalizado }) => {
      setPublicGameModal(prev =>
        prev && prev._id === gameId
          ? { ...prev, score1, score2, ...(typeof partidoFinalizado === 'boolean' ? { partidoFinalizado } : {}) }
          : prev
      );
    };

    socket.on('set_score_update', handleSetScoreUpdate);
    socket.on('sets_history_update', handleSetsHistoryUpdate);
    socket.on('score_update', handleScoreUpdate);

    if (publicGameModal.partidoFinalizado) {
      setLiveSetScore({ score1: 0, score2: 0 });
    }

    return () => {
      socket.off('set_score_update', handleSetScoreUpdate);
      socket.off('sets_history_update', handleSetsHistoryUpdate);
      socket.off('score_update', handleScoreUpdate);
    };
  }, [publicGameModal, socket]);

  return (
    <div className="carousel-container">
      <div className="carousel-title">
        <span>{language === 'en' ? 'Results' : 'Resultados'}</span>
        <select
          className="carousel-dropdown"
          value={selectedLeague}
          onChange={(e) => setSelectedLeague(e.target.value)}
        >
          {leagues.map((l) => (
            <option key={l._id} value={l._id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>
      <div
        className="carousel-scroll"
        style={{
          minHeight: 100,
          transition: "min-height 0.2s"
        }}
      >
        {(loading || appLoading) ? (
          <div
            style={{
              color: "#fff",
              padding: 16,
              textAlign: "left",
              width: "100%",
              fontSize: "clamp(1rem, 2.5vw, 1.3rem)",
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: 8,
              border: "1px solid rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)"
            }}
          >
            {language === 'en' 
              ? `Loading${'.'.repeat(loadingDots + 1)}`
              : `Cargando${'.'.repeat(loadingDots + 1)}`
            }
          </div>
        ) : leagues.length === 0 ? (
          <div style={{ 
            color: "#fff", 
            padding: 16, 
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: 8,
            border: "1px solid rgba(255, 255, 255, 0.1)"
          }}>
            {language === 'en' 
              ? 'No leagues available.'
              : 'No hay ligas disponibles.'
            }
          </div>
        ) : games.length === 0 ? (
          <div style={{ 
            color: "#fff", 
            padding: 16, 
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: 8,
            border: "1px solid rgba(255, 255, 255, 0.1)"
          }}>
            {language === 'en' 
              ? 'No games scheduled.'
              : 'No hay partidos programados.'
            }
          </div>
        ) : (
          games.map((game, idx) => {
            const team1 = getTeamData(game.team1_abbr || game.team1);
            const team2 = getTeamData(game.team2_abbr || game.team2);

            const started = !!(game.citados && game.citados.trim() !== "");
            let sets1 = "-";
            let sets2 = "-";
            if (started) {
              if (
                typeof game.sets1 === "number" &&
                typeof game.sets2 === "number"
              ) {
                sets1 = game.sets1;
                sets2 = game.sets2;
              } else if (Array.isArray(game.setsHistory) && game.setsHistory.length > 0) {
                sets1 = game.setsHistory.filter(s => s.score1 > s.score2).length;
                sets2 = game.setsHistory.filter(s => s.score2 > s.score1).length;
              } else {
                sets1 = 0;
                sets2 = 0;
              }
            }

            return (
              <div
                className="game-card"
                key={idx}
                onClick={() => setPublicGameModal(game)}
                style={{ cursor: "pointer", position: "relative" }}
              >
                {/* Indicador LIVE: círculo rojo parpadeante */}
                {(!game.partidoFinalizado && game.citados && game.citados.trim() !== "") && (
                  <span
                    className="live-dot live-dot-blink"
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "#e53935",
                      border: "2px solid #fff",
                      boxShadow: "0 0 6px #e53935",
                      zIndex: 2,
                      display: "inline-block"
                    }}
                  ></span>
                )}
                <div className="teams-vertical-sets">
                  <div className="team-vertical-sets">
                    <div className="team-vertical-info">
                      {team1.logo && (
                        <img
                          src={team1.logo}
                          alt={team1.abbr}
                          className="team-logo-vertical"
                        />
                      )}
                      <span className="team-abbr-vertical">{team1.abbr}</span>
                    </div>
                    <span className="team-sets-vertical">{sets1}</span>
                  </div>
                  <div className="team-vertical-sets">
                    <div className="team-vertical-info">
                      {team2.logo && (
                        <img
                          src={team2.logo}
                          alt={team2.abbr}
                          className="team-logo-vertical"
                        />
                      )}
                      <span className="team-abbr-vertical">{team2.abbr}</span>
                    </div>
                    <span className="team-sets-vertical">{sets2}</span>
                  </div>
                </div>
                <div className="game-date">
                  {formatDate(game.date)} {game.time}
                </div>
              </div>
            );
          })
        )}
      </div>
      {/* Modal de detalle de sets y marcador en vivo para público */}
      {publicGameModal && (() => {
        // Definir team1 y team2 para el modal usando getTeamData
        const team1 = getTeamData(publicGameModal.team1_abbr || publicGameModal.team1);
        const team2 = getTeamData(publicGameModal.team2_abbr || publicGameModal.team2);

        // Busca el nombre completo del equipo
        const team1FullName = teams.find(
          t => t.abbr === (publicGameModal.team1_abbr || publicGameModal.team1) || t.name === (publicGameModal.team1_abbr || publicGameModal.team1)
        )?.name || (publicGameModal.team1_abbr || publicGameModal.team1);

        const team2FullName = teams.find(
          t => t.abbr === (publicGameModal.team2_abbr || publicGameModal.team2) || t.name === (publicGameModal.team2_abbr || publicGameModal.team2)
        )?.name || (publicGameModal.team2_abbr || publicGameModal.team2);

        return (
          <div className="modal-overlay" onClick={() => setPublicGameModal(null)} style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: window.innerWidth <= 768 ? 'flex-start' : 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: window.innerWidth <= 768 ? '10px' : '20px',
            paddingTop: window.innerWidth <= 768 ? '20px' : '20px'
          }}>
            <div 
              className="modal-content" 
              onClick={e => e.stopPropagation()} 
              style={{ 
                maxWidth: window.innerWidth <= 768 ? '95vw' : 600,
                width: '100%',
                backgroundColor: '#fff',
                borderRadius: window.innerWidth <= 768 ? '16px' : '12px',
                padding: window.innerWidth <= 768 ? '16px' : '24px',
                position: 'relative',
                maxHeight: window.innerWidth <= 768 ? 'calc(100vh - 40px)' : '90vh',
                overflowY: 'auto',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                margin: window.innerWidth <= 768 ? '0 auto' : '0'
              }}
            >
              <button
                className="btn btn-secondary close-button"
                onClick={() => setPublicGameModal(null)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666',
                  zIndex: 1001,
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#f0f0f0';
                  e.target.style.color = '#333';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'none';
                  e.target.style.color = '#666';
                }}
              >
                &times;
              </button>
              
              {/* Título del partido */}
              <div style={{
                textAlign: 'center',
                marginBottom: window.innerWidth <= 768 ? '16px' : '20px',
                paddingTop: '8px'
              }}>
                <h3 style={{
                  margin: '0 0 8px 0',
                  fontSize: window.innerWidth <= 768 ? 'clamp(16px, 5vw, 20px)' : 'clamp(18px, 4vw, 24px)',
                  color: '#333',
                  fontWeight: 'bold'
                }}>
                  {language === 'en' ? 'Game Details' : 'Detalles del Partido'}
                </h3>
                <div style={{
                  fontSize: window.innerWidth <= 768 ? 'clamp(12px, 3.5vw, 14px)' : 'clamp(14px, 3vw, 16px)',
                  color: '#666',
                  marginBottom: window.innerWidth <= 768 ? '12px' : '16px'
                }}>
                  {formatDate(publicGameModal.date)} {publicGameModal.time}
                </div>
                {/* Estado del partido */}
                <span style={{
                  display: 'inline-block',
                  padding: window.innerWidth <= 768 ? '4px 12px' : '6px 16px',
                  borderRadius: '20px',
                  fontSize: window.innerWidth <= 768 ? '12px' : '14px',
                  fontWeight: 'bold',
                  backgroundColor: publicGameModal.partidoFinalizado
                    ? '#007bff'
                    : (!publicGameModal.citados || publicGameModal.citados.trim() === '')
                      ? '#6c757d'
                      : '#28a745',
                  color: '#fff'
                }}>
                  {publicGameModal.partidoFinalizado
                    ? (language === 'en' ? 'Finished' : 'Finalizado')
                    : (!publicGameModal.citados || publicGameModal.citados.trim() === '')
                      ? (language === 'en' ? 'Pending' : 'Pendiente')
                      : (language === 'en' ? 'Live' : 'En vivo')}
                </span>
              </div>

              {/* Equipos alineados izquierda/derecha */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: window.innerWidth <= 768 ? '16px' : '20px',
                width: '100%'
              }}>
                <div
                  style={{
                    textAlign: 'center',
                    flex: '1 1 0%',
                    fontWeight: 'bold',
                    fontSize: window.innerWidth <= 768 ? 'clamp(14px, 4vw, 18px)' : 'clamp(16px, 4vw, 22px)',
                    color: '#333'
                  }}
                >
                  {team1.abbr}
                </div>
                <div
                  style={{
                    margin: window.innerWidth <= 768 ? '0 12px' : '0 20px',
                    fontWeight: 'bold',
                    fontSize: window.innerWidth <= 768 ? 'clamp(12px, 3vw, 16px)' : 'clamp(14px, 3vw, 18px)',
                    color: '#666'
                  }}
                >
                  vs
                </div>
                <div
                  style={{
                    textAlign: 'center',
                    flex: '1 1 0%',
                    fontWeight: 'bold',
                    fontSize: window.innerWidth <= 768 ? 'clamp(14px, 4vw, 18px)' : 'clamp(16px, 4vw, 22px)',
                    color: '#333'
                  }}
                >
                  {team2.abbr}
                </div>
              </div>
              {/* Logos de los equipos centrados */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: window.innerWidth <= 768 ? '16px' : '20px',
                gap: window.innerWidth <= 768 ? '20px' : '30px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  {team1.logo && (
                    <img
                      src={team1.logo}
                      alt={team1.abbr}
                      style={{ 
                        height: window.innerWidth <= 768 ? '60px' : '80px', 
                        width: window.innerWidth <= 768 ? '60px' : '80px', 
                        objectFit: 'contain',
                        marginBottom: '6px'
                      }}
                    />
                  )}
                  <div style={{
                    fontSize: window.innerWidth <= 768 ? '11px' : '14px',
                    fontWeight: 'bold',
                    color: '#333',
                    lineHeight: '1.2',
                    maxWidth: window.innerWidth <= 768 ? '80px' : '100px',
                    wordWrap: 'break-word'
                  }}>
                    {team1FullName}
                  </div>
                </div>
                <div style={{
                  fontSize: window.innerWidth <= 768 ? '18px' : '24px',
                  fontWeight: 'bold',
                  color: '#666'
                }}>
                  VS
                </div>
                <div style={{ textAlign: 'center' }}>
                  {team2.logo && (
                    <img
                      src={team2.logo}
                      alt={team2.abbr}
                      style={{ 
                        height: window.innerWidth <= 768 ? '60px' : '80px', 
                        width: window.innerWidth <= 768 ? '60px' : '80px', 
                        objectFit: 'contain',
                        marginBottom: '6px'
                      }}
                    />
                  )}
                  <div style={{
                    fontSize: window.innerWidth <= 768 ? '11px' : '14px',
                    fontWeight: 'bold',
                    color: '#333',
                    lineHeight: '1.2',
                    maxWidth: window.innerWidth <= 768 ? '80px' : '100px',
                    wordWrap: 'break-word'
                  }}>
                    {team2FullName}
                  </div>
                </div>
              </div>
              {/* Tabla de sets con marcador en vivo */}
              <div style={{ marginBottom: window.innerWidth <= 768 ? '12px' : '20px' }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  fontSize: window.innerWidth <= 768 ? '12px' : '14px'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#e9ecef' }}>
                      <th style={{ 
                        padding: window.innerWidth <= 768 ? '8px 6px' : '12px 8px', 
                        border: '1px solid #dee2e6', 
                        fontWeight: 'bold', 
                        color: '#495057',
                        fontSize: window.innerWidth <= 768 ? '11px' : '14px'
                      }}>
                        {language === 'en' ? 'Team' : 'Equipo'}
                      </th>
                      {Array.isArray(publicGameModal.setsHistory)
                        ? publicGameModal.setsHistory.map((_, idx) => (
                            <th key={idx} style={{ 
                              padding: window.innerWidth <= 768 ? '8px 4px' : '12px 8px', 
                              border: '1px solid #dee2e6', 
                              fontWeight: 'bold', 
                              color: '#495057', 
                              textAlign: 'center',
                              fontSize: window.innerWidth <= 768 ? '10px' : '12px'
                            }}>
                              S{idx + 1}
                            </th>
                          ))
                        : null}
                      {(!publicGameModal.partidoFinalizado && publicGameModal.citados && publicGameModal.citados.trim() !== '') && (
                        <th style={{ 
                          padding: window.innerWidth <= 768 ? '8px 4px' : '12px 8px', 
                          border: '1px solid #dee2e6', 
                          color: '#28a745', 
                          fontWeight: 'bold', 
                          textAlign: 'center',
                          fontSize: window.innerWidth <= 768 ? '10px' : '12px'
                        }}>
                          {language === 'en' ? 'Live' : 'En vivo'}
                        </th>
                      )}
                      <th style={{ 
                        padding: window.innerWidth <= 768 ? '8px 6px' : '12px 8px', 
                        border: '1px solid #dee2e6', 
                        fontWeight: 'bold', 
                        color: '#495057', 
                        textAlign: 'center',
                        fontSize: window.innerWidth <= 768 ? '11px' : '14px'
                      }}>
                        {language === 'en' ? 'Sets' : 'Sets'}
                      </th>
                    </tr>
                  </thead>                  <tbody>
                    <tr>
                      <td style={{ 
                        padding: window.innerWidth <= 768 ? '8px 6px' : '12px 8px', 
                        border: '1px solid #dee2e6', 
                        fontWeight: 'bold', 
                        backgroundColor: '#fff',
                        fontSize: window.innerWidth <= 768 ? '11px' : '14px',
                        maxWidth: window.innerWidth <= 768 ? '80px' : 'auto',
                        wordWrap: 'break-word'
                      }}>
                        {window.innerWidth <= 768 ? team1.abbr : team1FullName}
                      </td>
                      {Array.isArray(publicGameModal.setsHistory)
                        ? publicGameModal.setsHistory.map((set, idx) => (
                            <td key={idx} style={{ 
                              padding: window.innerWidth <= 768 ? '8px 4px' : '12px 8px', 
                              border: '1px solid #dee2e6', 
                              textAlign: 'center', 
                              backgroundColor: '#fff',
                              fontSize: window.innerWidth <= 768 ? '11px' : '14px'
                            }}>
                              {set.score1}
                            </td>
                          ))
                        : null}
                      {(!publicGameModal.partidoFinalizado && publicGameModal.citados && publicGameModal.citados.trim() !== '') && (
                        <td style={{ 
                          padding: window.innerWidth <= 768 ? '8px 4px' : '12px 8px', 
                          border: '1px solid #dee2e6', 
                          textAlign: 'center', 
                          color: '#28a745', 
                          fontWeight: 'bold', 
                          backgroundColor: '#fff',
                          fontSize: window.innerWidth <= 768 ? '11px' : '14px'
                        }}>
                          {liveSetScore.score1}
                        </td>
                      )}
                      <td style={{
                        padding: window.innerWidth <= 768 ? '8px 6px' : '12px 8px',
                        border: '1px solid #dee2e6',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        backgroundColor: '#e9ecef',
                        color: '#495057',
                        fontSize: window.innerWidth <= 768 ? '12px' : '14px'
                      }}>
                        {(typeof publicGameModal.sets1 === "number"
                          ? publicGameModal.sets1
                          : (Array.isArray(publicGameModal.setsHistory)
                              ? publicGameModal.setsHistory.filter(s => s.score1 > s.score2).length
                              : 0))}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ 
                        padding: window.innerWidth <= 768 ? '8px 6px' : '12px 8px', 
                        border: '1px solid #dee2e6', 
                        fontWeight: 'bold', 
                        backgroundColor: '#fff',
                        fontSize: window.innerWidth <= 768 ? '11px' : '14px',
                        maxWidth: window.innerWidth <= 768 ? '80px' : 'auto',
                        wordWrap: 'break-word'
                      }}>
                        {window.innerWidth <= 768 ? team2.abbr : team2FullName}
                      </td>
                      {Array.isArray(publicGameModal.setsHistory)
                        ? publicGameModal.setsHistory.map((set, idx) => (
                            <td key={idx} style={{ 
                              padding: window.innerWidth <= 768 ? '8px 4px' : '12px 8px', 
                              border: '1px solid #dee2e6', 
                              textAlign: 'center', 
                              backgroundColor: '#fff',
                              fontSize: window.innerWidth <= 768 ? '11px' : '14px'
                            }}>
                              {set.score2}
                            </td>
                          ))
                        : null}
                      {(!publicGameModal.partidoFinalizado && publicGameModal.citados && publicGameModal.citados.trim() !== '') && (
                        <td style={{ 
                          padding: window.innerWidth <= 768 ? '8px 4px' : '12px 8px', 
                          border: '1px solid #dee2e6', 
                          textAlign: 'center', 
                          color: '#28a745', 
                          fontWeight: 'bold', 
                          backgroundColor: '#fff',
                          fontSize: window.innerWidth <= 768 ? '11px' : '14px'
                        }}>
                          {liveSetScore.score2}
                        </td>
                      )}
                      <td style={{
                        padding: window.innerWidth <= 768 ? '8px 6px' : '12px 8px',
                        border: '1px solid #dee2e6',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        backgroundColor: '#e9ecef',
                        color: '#495057',
                        fontSize: window.innerWidth <= 768 ? '12px' : '14px'
                      }}>
                        {(typeof publicGameModal.sets2 === "number"
                          ? publicGameModal.sets2
                          : (Array.isArray(publicGameModal.setsHistory)
                              ? publicGameModal.setsHistory.filter(s => s.score2 > s.score1).length
                              : 0))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default HorizontalGamesCarousel;
