import React, { useEffect, useState } from "react";
import "../styles/HorizontalCarousel.css";
import { API_BASE_URL } from "../assets/Configuration/config.js";
import { io as socketIOClient } from "socket.io-client";

const LEAGUES_URL = `${API_BASE_URL}/api/leagues`;
const GAMES_URL = `${API_BASE_URL}/api/games`;
const TEAMS_URL = `${API_BASE_URL}/api/teams`;
const SOCKET_URL = API_BASE_URL;

const HorizontalGamesCarousel = () => {
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState("");
  const [games, setGames] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [publicGameModal, setPublicGameModal] = useState(null);
  const [liveSetScore, setLiveSetScore] = useState({ score1: 0, score2: 0 });
  const [loadingDots, setLoadingDots] = useState(0);

  // Animación de puntos para "Cargando..."
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingDots(dots => (dots + 1) % 3);
    }, 500);
    return () => clearInterval(interval);
  }, [loading]);

  // Cargar ligas al montar
  useEffect(() => {
    fetch(LEAGUES_URL)
      .then((res) => res.json())
      .then((data) => {
        setLeagues(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0)
          setSelectedLeague(data[0]._id);
      });
  }, []);

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

    // Espera a que ambos: fetch termine y pasen al menos 3 segundos
    let isMounted = true;
    const fetchPromise = fetch(`${GAMES_URL}?league=${selectedLeague}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setGames(Array.isArray(data.games) ? data.games : []);
        }
      })
      .catch(() => {
        if (isMounted) setGames([]);
      });

    const delayPromise = new Promise(resolve => setTimeout(resolve, 3000));

    Promise.all([fetchPromise, delayPromise]).then(() => {
      if (isMounted) setLoading(false);
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
        <span>Resultados</span>
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
        {loading ? (
          <div
            style={{
              color: "#fff",
              padding: 16,
              textAlign: "left",
              width: "100%",
              fontSize: "clamp(1rem, 2.5vw, 1.3rem)"
            }}
          >
            {`Cargando${'.'.repeat(loadingDots + 1)}`}
          </div>
        ) : games.length === 0 ? (
          <div style={{ color: "#fff", padding: 16 }}>
            No hay partidos programados.
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
                  {game.date} {game.time}
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
          <div className="modal-overlay" onClick={() => setPublicGameModal(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 600, paddingTop: 56, position: 'relative' }}>
              <button
                className="btn btn-secondary close-button"
                onClick={() => setPublicGameModal(null)}
              >
                &times;
              </button>
              {/* Equipos alineados izquierda/derecha */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
                width: '100%',
                marginTop: 0
              }}>
                <div
                  style={{
                    textAlign: 'center',
                    flex: '1 1 0%',
                    fontWeight: 'bold',
                    fontSize: 'clamp(13px, 4vw, 20px)',
                    whiteSpace: 'normal',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    wordBreak: 'break-word',
                  }}
                >
                  {team1.abbr}
                </div>
                <div
                  style={{
                    margin: '0 10px',
                    fontWeight: 'bold',
                    fontSize: 'clamp(11px, 3vw, 18px)',
                    color: '#555',
                    whiteSpace: 'nowrap'
                  }}
                >
                  vs
                </div>
                <div
                  style={{
                    textAlign: 'center',
                    flex: '1 1 0%',
                    fontWeight: 'bold',
                    fontSize: 'clamp(13px, 4vw, 20px)',
                    whiteSpace: 'normal',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    wordBreak: 'break-word',
                  }}
                >
                  {team2.abbr}
                </div>
              </div>
              {/* Logos de los equipos debajo del nombre */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
                width: '100%'
              }}>
                <div style={{ flex: '1 1 0%', textAlign: 'center', minWidth: 0 }}>
                  {team1.logo && (
                    <img
                      src={team1.logo}
                      alt={team1.abbr}
                      style={{ maxHeight: 100, maxWidth: 140, objectFit: 'contain', display: 'inline-block' }}
                    />
                  )}
                </div>
                <div style={{ width: 48, minWidth: 48 }}></div>
                <div style={{ flex: '1 1 0%', textAlign: 'center', minWidth: 0 }}>
                  {team2.logo && (
                    <img
                      src={team2.logo}
                      alt={team2.abbr}
                      style={{ maxHeight: 100, maxWidth: 140, objectFit: 'contain', display: 'inline-block' }}
                    />
                  )}
                </div>
              </div>
              {/* Tabla de sets con marcador en vivo */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 4 }}>
                <thead>
                  <tr style={{ background: '#f0f0f0' }}>
                    <th style={{ padding: 6, border: '1px solid #ddd' }}></th>
                    {Array.isArray(publicGameModal.setsHistory)
                      ? publicGameModal.setsHistory.map((_, idx) => (
                          <th key={idx} style={{ padding: 6, border: '1px solid #ddd' }}>S{idx + 1}</th>
                        ))
                      : null}
                    {/* Solo mostrar columna en vivo si el partido está en curso */}
                    {(!publicGameModal.partidoFinalizado && publicGameModal.citados && publicGameModal.citados.trim() !== '') && (
                      <th style={{ padding: 6, border: '1px solid #ddd', color: '#007bff' }}>
                        En vivo
                      </th>
                    )}
                    <th style={{ padding: 6, border: '1px solid #ddd' }}>Sets</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: 6, border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'right' }}>
                      {team1FullName}
                    </td>
                    {Array.isArray(publicGameModal.setsHistory)
                      ? publicGameModal.setsHistory.map((set, idx) => (
                          <td key={idx} style={{ padding: 6, border: '1px solid #ddd', textAlign: 'center' }}>
                            {set.score1}
                          </td>
                        ))
                      : null}
                    {/* Solo mostrar puntaje en vivo si el partido está en curso */}
                    {(!publicGameModal.partidoFinalizado && publicGameModal.citados && publicGameModal.citados.trim() !== '') && (
                      <td style={{ padding: 6, border: '1px solid #ddd', textAlign: 'center', color: '#007bff', fontWeight: 'bold' }}>
                        {liveSetScore.score1}
                      </td>
                    )}
                    <td
                      className="sets-cell"
                      style={{
                        padding: 6,
                        fontWeight: 'bold',
                        textAlign: 'center'
                      }}
                    >
                      {(typeof publicGameModal.sets1 === "number"
                        ? publicGameModal.sets1
                        : (Array.isArray(publicGameModal.setsHistory)
                            ? publicGameModal.setsHistory.filter(s => s.score1 > s.score2).length
                            : 0))}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: 6, border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'right' }}>
                      {team2FullName}
                    </td>
                    {Array.isArray(publicGameModal.setsHistory)
                      ? publicGameModal.setsHistory.map((set, idx) => (
                          <td key={idx} style={{ padding: 6, border: '1px solid #ddd', textAlign: 'center' }}>
                            {set.score2}
                          </td>
                        ))
                      : null}
                    {/* Solo mostrar puntaje en vivo si el partido está en curso */}
                    {(!publicGameModal.partidoFinalizado && publicGameModal.citados && publicGameModal.citados.trim() !== '') && (
                      <td style={{ padding: 6, border: '1px solid #ddd', textAlign: 'center', color: '#007bff', fontWeight: 'bold' }}>
                        {liveSetScore.score2}
                      </td>
                    )}
                    <td
                      className="sets-cell"
                      style={{
                        padding: 6,
                        fontWeight: 'bold',
                        textAlign: 'center'
                      }}
                    >
                      {(typeof publicGameModal.sets2 === "number"
                        ? publicGameModal.sets2
                        : (Array.isArray(publicGameModal.setsHistory)
                            ? publicGameModal.setsHistory.filter(s => s.score2 > s.score1).length
                            : 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div style={{ fontSize: 15, color: '#888', marginTop: 10 }}>
                {publicGameModal.date} {publicGameModal.time}
              </div>
              <div style={{
                marginTop: 12,
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: 18,
                color: publicGameModal.partidoFinalizado
                  ? '#007bff'
                  : (!publicGameModal.citados || publicGameModal.citados.trim() === '')
                    ? '#888'
                    : '#28a745'
              }}>
                {publicGameModal.partidoFinalizado
                  ? 'Finalizado'
                  : (!publicGameModal.citados || publicGameModal.citados.trim() === '')
                    ? 'Pendiente'
                    : 'En vivo'}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default HorizontalGamesCarousel;
