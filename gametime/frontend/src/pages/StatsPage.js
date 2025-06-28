import React, { useEffect, useState, useCallback } from 'react';
import { API_BASE_URL } from '../assets/Configuration/config';
import texts from '../translations/texts';
import '../styles/StatsPage.css';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

// Cambia la definición de STAT_CATEGORIES para usar totales en vez de "por set"
const STAT_CATEGORIES = [
  {
    key: 'blocks',
    label: 'Bloqueos',
    columns: [
      { key: 'playerName', label: 'Jugador' },
      { key: 'team', label: 'Equipo' },
      { key: 'blocks', label: 'Bloqueos' }
    ]
  },
  {
    key: 'assists',
    label: 'Asistencias',
    columns: [
      { key: 'playerName', label: 'Jugador' },
      { key: 'team', label: 'Equipo' },
      { key: 'assists', label: 'Asistencias' }
    ]
  },
  {
    key: 'aces',
    label: 'Aces',
    columns: [
      { key: 'playerName', label: 'Jugador' },
      { key: 'team', label: 'Equipo' },
      { key: 'aces', label: 'Aces' }
    ]
  },
  {
    key: 'attacks',
    label: 'Ataques',
    columns: [
      { key: 'playerName', label: 'Jugador' },
      { key: 'team', label: 'Equipo' },
      { key: 'attacks', label: 'Ataques' }
    ]
  },
  {
    key: 'digs',
    label: 'Defensas',
    columns: [
      { key: 'playerName', label: 'Jugador' },
      { key: 'team', label: 'Equipo' },
      { key: 'digs', label: 'Defensas' }
    ]
  },
  {
    key: 'hittingErrors',
    label: 'Errores de golpeo',
    columns: [
      { key: 'playerName', label: 'Jugador' },
      { key: 'team', label: 'Equipo' },
      { key: 'hittingErrors', label: 'Errores de golpeo' }
    ]
  },
  {
    key: 'kills',
    label: 'Remates',
    columns: [
      { key: 'playerName', label: 'Jugador' },
      { key: 'team', label: 'Equipo' },
      { key: 'kills', label: 'Remates' }
    ]
  },
  {
    key: 'points',
    label: 'Puntos',
    columns: [
      { key: 'playerName', label: 'Jugador' },
      { key: 'team', label: 'Equipo' },
      { key: 'points', label: 'Puntos' }
    ]
  }
];

// Unused variable - commented out
// const tableColors = [
//   "primary", "success", "warning", "danger", "info", "secondary", "dark", "light"
// ];

const StatsPage = ({ language = 'es', activeLeague, onLeagueChange }) => {
  // Obtener el rol del usuario desde localStorage (igual que GamesPage)
  const [userRole] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user?.esAdmin === true || user?.esAdmin === 'true') return 'admin';
      if (user?.role === 'admin' || user?.tipoCuenta === 'admin') return 'admin';
      if (user?.role === 'content_editor' || user?.tipoCuenta === 'content-editor') return 'content-editor';
      return 'public';
    } catch {
      return 'public';
    }
  });

  // Solo admin y content-editor pueden editar
  const isEditor = userRole === 'admin' || userRole === 'content-editor';

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leagues, setLeagues] = useState([]);
  const [localActiveLeague, setLocalActiveLeague] = useState(() => {
    // Guardar y recuperar la liga activa desde sessionStorage
    return sessionStorage.getItem('statsActiveLeague') || null;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [games, setGames] = useState([]);
  const [playerAverages, setPlayerAverages] = useState([]);
  const [gameStats, setGameStats] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStats, setEditingStats] = useState(null);
  const [modalCategory, setModalCategory] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [newStats, setNewStats] = useState({
    setsPlayed: '',
    blocks: '',
    assists: '',
    aces: '',
    attacks: '',
    digs: '',
    hittingErrors: '',
    kills: '',
    points: ''
  });

  const leagueId = activeLeague || localActiveLeague;

  // Funciones auxiliares para recargar datos
  const fetchPlayerAverages = useCallback(async (currentLeagueId = leagueId) => {
    if (!currentLeagueId) return setPlayerAverages([]);
    try {
      const res = await fetch(`${API_BASE_URL}/api/game-stats/player-averages?league=${currentLeagueId}`);
      const data = await res.json();
      setPlayerAverages(Array.isArray(data) ? data : []);
    } catch {
      setPlayerAverages([]);
    }
  }, [leagueId]);

  const fetchGameStats = useCallback(async (currentLeagueId = leagueId) => {
    if (!currentLeagueId) return setGameStats([]);
    try {
      const res = await fetch(`${API_BASE_URL}/api/game-stats?league=${currentLeagueId}`);
      const data = await res.json();
      setGameStats(Array.isArray(data) ? data : []);
    } catch {
      setGameStats([]);
    }
  }, [leagueId]);

  useEffect(() => {
    // Cuando cambia la liga activa, guarda en sessionStorage
    if (leagueId) {
      sessionStorage.setItem('statsActiveLeague', leagueId);
    }
  }, [leagueId]);

  useEffect(() => {
    setLoading(true);
    const fetchLeagues = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/leagues`);
        const data = await res.json();
        const leagueList = Array.isArray(data) ? data : data.leagues || [];
        setLeagues(leagueList);
        // Si hay una liga guardada en sessionStorage y existe, selecciónala
        const storedLeague = sessionStorage.getItem('statsActiveLeague');
        if (storedLeague && leagueList.some(l => l._id === storedLeague)) {
          setLocalActiveLeague(storedLeague);
        } else if (!activeLeague && leagueList.length > 0) {
          setLocalActiveLeague(leagueList[0]._id);
        }
      } catch {
        setLeagues([]);
      }
    };
    fetchLeagues().finally(() => setLoading(false));
  }, [activeLeague]);

  useEffect(() => {
    setLoading(true);
    const fetchTeams = async () => {
      if (!leagueId) return setTeams([]);
      try {
        const res = await fetch(`${API_BASE_URL}/api/teams?league=${leagueId}`);
        const data = await res.json();
        setTeams(Array.isArray(data.teams) ? data.teams : []);
      } catch {
        setTeams([]);
      }
      setLoading(false);
    };
    fetchTeams();
  }, [leagueId]);

  useEffect(() => {
    setLoading(true);
    const fetchGames = async () => {
      if (!leagueId) return setGames([]);
      try {
        const res = await fetch(`${API_BASE_URL}/api/games?league=${leagueId}`);
        const data = await res.json();
        setGames(Array.isArray(data.games) ? data.games : []);
      } catch {
        setGames([]);
      }
      setLoading(false);
    };
    fetchGames();
  }, [leagueId]);

  // Nuevo useEffect para cargar promedios de jugadores
  useEffect(() => {
    fetchPlayerAverages();
  }, [leagueId, fetchPlayerAverages]);

  // Nuevo useEffect para cargar estadísticas de partidos
  useEffect(() => {
    fetchGameStats();
  }, [leagueId, fetchGameStats]);

  // Procesa los promedios de jugadores desde la nueva API
  const allPlayers = playerAverages.map(avg => ({
    playerName: avg.playerName,
    team: avg.team,
    blocks: Number(avg.blocksPerSet ?? 0),
    assists: Number(avg.assistsPerSet ?? 0),
    aces: Number(avg.acesPerSet ?? 0),
    attacks: Number(avg.attacksPerSet ?? 0),
    digs: Number(avg.digsPerSet ?? 0),
    hittingErrors: Number(avg.hittingErrorsPerSet ?? 0),
    kills: Number(avg.killsPerSet ?? 0),
    points: Number(avg.pointsPerSet ?? 0),
    totalGames: avg.totalGames,
    totalSets: avg.totalSets
  }));

  // Filtra por búsqueda y liga, y solo muestra jugadores con valor > 0 en la estadística correspondiente
  const filteredStats = (catKey) => {
    return allPlayers
      .filter(p =>
        (!searchQuery ||
          p.playerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.team?.toLowerCase().includes(searchQuery.toLowerCase())
        ) &&
        typeof p[catKey] === 'number' &&
        p[catKey] > 0 // Solo muestra si tiene valor mayor a 0 en la estadística
      )
      .sort((a, b) => b[catKey] - a[catKey]);
  };

  const groupedCategories = [];
  for (let i = 0; i < STAT_CATEGORIES.length; i += 2) {
    groupedCategories.push(STAT_CATEGORIES.slice(i, i + 2));
  }

  // Traducción de headers de tabla
  const getLabel = (key) => {
    const t = texts[language] || texts['es']; // Siempre usa español por defecto
    switch (key) {
      case 'playerName': return t?.player_name || 'Jugador';
      case 'team': return t?.team || 'Equipo';
      case 'blocks': return (t?.blocks_per_set || 'Bloqueos por set');
      case 'assists': return (t?.assists_per_set || 'Asistencias por set');
      case 'aces': return (t?.aces_per_set || 'Aces por set');
      case 'attacks': return (t?.attacks_per_set || 'Ataques por set');
      case 'digs': return (t?.digs_per_set || 'Defensas por set');
      case 'hittingErrors': return (t?.hitting_errors || 'Errores de golpeo') + ' / set';
      case 'kills': return (t?.kills_per_set || 'Remates por set');
      case 'points': return (t?.points_per_set || 'Puntos por set');
      default: return key;
    }
  };

  // Obtener partidos finalizados
  const finishedGames = games.filter(g => g.partidoFinalizado);

  // Obtener citados de un partido
  const getCitadosList = (game) => {
    if (!game) return { team1: [], team2: [] };
    const citadosArr = (game.citados || '').split(',').map(s => s.trim()).filter(Boolean);

    const team1 = teams.find(t => t.name === game.team1);
    const team2 = teams.find(t => t.name === game.team2);

    // Solo los citados que pertenecen a cada equipo
    const team1Citados = (team1?.roster || [])
      .filter(p => citadosArr.includes(p.name))
      .map(p => ({ ...p, team: team1.name }));

    const team2Citados = (team2?.roster || [])
      .filter(p => citadosArr.includes(p.name))
      .map(p => ({ ...p, team: team2.name }));

    return { team1: team1Citados, team2: team2Citados };
  };

  // Abrir modal para agregar estadística en una categoría
  const openAddModal = (cat) => {
    setModalCategory(cat);
    setShowAddModal(true);
    setSelectedGame(null);
    setSelectedPlayer(null);
    setEditingStats(null); // Reset editing state
    setNewStats({
      setsPlayed: '',
      blocks: '',
      assists: '',
      aces: '',
      attacks: '',
      digs: '',
      hittingErrors: '',
      kills: '',
      points: ''
    });
  };

  // Guardar estadísticas usando la nueva API de game-stats
  const handleSaveStats = async () => {
    if (!selectedPlayer || !selectedGame || !newStats.setsPlayed || Number(newStats.setsPlayed) < 1) return;
    
    const statsData = {
      gameId: selectedGame._id,
      playerName: selectedPlayer.name,
      team: selectedPlayer.team,
      league: leagueId,
      setsPlayed: Number(newStats.setsPlayed),
      aces: Number(newStats.aces) || 0,
      assists: Number(newStats.assists) || 0,
      attacks: Number(newStats.attacks) || 0,
      blocks: Number(newStats.blocks) || 0,
      digs: Number(newStats.digs) || 0,
      hittingErrors: Number(newStats.hittingErrors) || 0,
      kills: Number(newStats.kills) || 0,
      points: Number(newStats.points) || 0
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/game-stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statsData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar estadísticas');
      }

      // Recargar datos
      await Promise.all([
        fetchPlayerAverages(),
        fetchGameStats()
      ]);
      
      setShowAddModal(false);
      setEditingStats(null);
      setSelectedGame(null);
      setSelectedPlayer(null);
      alert(language === 'en' ? 'Statistics saved successfully!' : '¡Estadísticas guardadas exitosamente!');
    } catch (error) {
      alert(error.message);
    }
  };

  // Precargar datos existentes al seleccionar jugador
  useEffect(() => {
    if (selectedPlayer && selectedGame) {
      // Buscar estadísticas existentes para este jugador en este partido
      const existingStats = gameStats.find(
        gs => gs.gameId === selectedGame._id && 
              gs.playerName === selectedPlayer.name && 
              gs.team === selectedPlayer.team
      );

      if (existingStats) {
        setNewStats({
          setsPlayed: String(existingStats.setsPlayed || ''),
          blocks: String(existingStats.blocks || ''),
          assists: String(existingStats.assists || ''),
          aces: String(existingStats.aces || ''),
          attacks: String(existingStats.attacks || ''),
          digs: String(existingStats.digs || ''),
          hittingErrors: String(existingStats.hittingErrors || ''),
          kills: String(existingStats.kills || ''),
          points: String(existingStats.points || ''),
        });
      } else {
        // Resetear formulario si no hay estadísticas existentes
        setNewStats({
          setsPlayed: '',
          blocks: '',
          assists: '',
          aces: '',
          attacks: '',
          digs: '',
          hittingErrors: '',
          kills: '',
          points: ''
        });
      }
    }
  }, [selectedPlayer, selectedGame, gameStats]);

  // Funciones para manejar la gestión de estadísticas
  const handleEditGameStats = (stat) => {
    setEditingStats(stat);
    setSelectedGame(games.find(g => g._id === stat.gameId));
    setSelectedPlayer({ name: stat.playerName, team: stat.team });
    setNewStats({
      setsPlayed: String(stat.setsPlayed || ''),
      blocks: String(stat.blocks || ''),
      assists: String(stat.assists || ''),
      aces: String(stat.aces || ''),
      attacks: String(stat.attacks || ''),
      digs: String(stat.digs || ''),
      hittingErrors: String(stat.hittingErrors || ''),
      kills: String(stat.kills || ''),
      points: String(stat.points || ''),
    });
    setShowEditModal(false);
    setShowAddModal(true);
  };

  const handleDeleteGameStats = async (statId) => {
    if (!window.confirm(language === 'en' 
      ? 'Are you sure you want to delete this statistic?' 
      : '¿Estás seguro de que quieres eliminar esta estadística?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/game-stats/${statId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Error al eliminar estadística');
      }

      // Recargar datos
      await Promise.all([
        fetchPlayerAverages(),
        fetchGameStats()
      ]);
      
      alert(language === 'en' ? 'Statistic deleted successfully!' : '¡Estadística eliminada exitosamente!');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="full-page-container">
      <div className="stats-container">
      {loading && <LoadingSpinner />}
      {!loading && (
        <>
          <h2 className="stats-title">
            {texts[language]?.navbar_statistics || 'Estadísticas'}
          </h2>
          <div className="stats-league-selector">
            <label className="me-2 fw-bold">{texts[language]?.league_label || 'Liga:'}</label>
            <select
              className="form-select w-auto"
              value={leagueId || ""}
              onChange={e => {
                // Solo ejecuta el cambio de liga, no hay submit ni recarga posible aquí
                if (typeof onLeagueChange === 'function') {
                  onLeagueChange(e.target.value);
                } else {
                  setLocalActiveLeague(e.target.value);
                  sessionStorage.setItem('statsActiveLeague', e.target.value);
                }
              }}
            >
              <option value="">{texts[language]?.select_league || 'Selecciona una liga'}</option>
              {leagues.map(l => (
                <option key={l._id || l.id || l.name} value={l._id || l.id || l.name}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div className="stats-search">
            <input
              type="text"
              className="form-control"
              placeholder={language === 'en' ? 'Search player or team...' : 'Buscar jugador o equipo...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          {/* Botón único para agregar información de partido/jugador */}
          {isEditor && (
            <div className="mb-3 d-flex justify-content-start gap-2">
              <button
                className="btn btn-sm btn-primary"
                onClick={() => openAddModal(null)}
              >
                {language === 'en' ? 'Add statistics' : 'Agregar estadísticas'}
              </button>
              <button
                className="btn btn-sm btn-info"
                onClick={() => setShowEditModal(true)}
              >
                {language === 'en' ? 'Manage Game Stats' : 'Gestionar estadísticas'}
              </button>
            </div>
          )}
          <div>
            {groupedCategories.map((catPair, rowIdx) => (
              <div className="row mb-4" key={rowIdx}>
                {catPair.map((cat, i) => {
                  const stats = filteredStats(cat.key);
                  return (
                    <div className="col-md-6 mb-4" key={cat.key}>
                      <div className="card stats-table-card">
                        <div className="card-header stats-table-header d-flex justify-content-between align-items-center">
                          <h4 className="mb-0 fs-5">{getLabel(cat.key)}</h4>
                          {/* Elimina el botón "Agregar" de cada tabla */}
                        </div>
                        <div className="card-body p-0">
                          <div className="table-responsive">
                            <table className="table stats-table align-middle mb-0">
                              <thead>
                                <tr>
                                  <th className="text-center" style={{ width: 50 }}>#</th>
                                  {cat.columns.map(col => (
                                    <th key={col.key} className="text-center">{getLabel(col.key)}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {stats.length === 0 ? (
                                  <tr>
                                    <td colSpan={cat.columns.length + 1} className="text-center" style={{ padding: '40px' }}>
                                      <EmptyState 
                                        icon="📊"
                                        title={language === 'en' ? 'No Statistics Available' : 'No hay estadísticas disponibles'}
                                        description={language === 'en' 
                                          ? 'No player statistics have been recorded for this category yet.' 
                                          : 'Aún no se han registrado estadísticas de jugadores para esta categoría.'
                                        }
                                        language={language}
                                      />
                                    </td>
                                  </tr>
                                ) : (
                                  stats.map((p, idx) => (
                                    <tr key={idx}>
                                      <td className="fw-bold text-center">
                                        <span className="badge bg-primary fs-6">{idx + 1}</span>
                                      </td>
                                      {cat.columns.map(col => (
                                        <td key={col.key} className="text-center">
                                          <span className="fw-semibold">{p[col.key]}</span>
                                        </td>
                                      ))}
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          {/* Modal para agregar estadística - Implementación personalizada */}
          {showAddModal && (
            <div 
              className="stats-modal-overlay"
              onClick={() => {
                setShowAddModal(false);
                setEditingStats(null);
                setSelectedGame(null);
                setSelectedPlayer(null);
              }}
            >
              <div 
                className="stats-modal-content"
                onClick={e => e.stopPropagation()}
              >
                <div className="stats-modal-header">
                  <h4>
                    {editingStats ? 
                      (language === 'en' ? 'Edit Statistic' : 'Editar Estadística') :
                      (language === 'en' ? 'Add Statistic' : 'Agregar Estadística')
                    }
                    {modalCategory ? ` - ${getLabel(modalCategory.key)}` : ''}
                  </h4>
                </div>

                {/* Body */}
                <div className="stats-modal-body">
                  {/* Paso 1: Seleccionar partido finalizado */}
                  <div className="stats-form-group">
                    <label className="stats-form-label">
                      {language === 'en' ? 'Select Finished Game' : 'Selecciona un partido finalizado'}
                    </label>
                    <select
                      className="form-select stats-form-input"
                      value={selectedGame ? selectedGame._id : ''}
                      onChange={e => {
                        const game = finishedGames.find(g => g._id === e.target.value);
                        setSelectedGame(game || null);
                        setSelectedPlayer(null);
                      }}
                    >
                      <option value="">
                        {language === 'en'
                          ? 'Select a finished game'
                          : 'Selecciona un partido finalizado'}
                      </option>
                      {finishedGames.map(g => (
                        <option key={g._id} value={g._id}>
                          {g.team1} vs {g.team2} - {g.date}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Paso 2: Seleccionar jugador citado */}
                  {selectedGame && (
                    <div className="stats-form-group">
                      <label className="stats-form-label-large">
                        {language === 'en' ? 'Select Player' : 'Selecciona un jugador'}
                      </label>
                      <div className="player-selection-container">
                        {(() => {
                          const citados = getCitadosList(selectedGame);
                          return (
                            <>
                              <div className="team-section">
                                <div className="team-header team-header-left">
                                  {selectedGame.team1}
                                </div>
                                <div className="team-players-container">
                                  {citados.team1.length === 0 && (
                                    <div className="team-no-players">
                                      {language === 'en'
                                        ? 'No called players for this team.'
                                        : 'No hay citados para este equipo.'}
                                    </div>
                                  )}
                                  {citados.team1.map((player, idx) => (
                                    <button
                                      key={player.name + player.team}
                                      type="button"
                                      className={`btn ${selectedPlayer && selectedPlayer.name === player.name && selectedPlayer.team === player.team ? 'btn-primary' : 'btn-outline-secondary'} player-button`}
                                      onClick={() => setSelectedPlayer(player)}
                                    >
                                      <span className="player-name">{player.name}</span>
                                      <span className="player-team">
                                        ({player.team})
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="team-section">
                                <div className="team-header team-header-right">
                                  {selectedGame.team2}
                                </div>
                                <div className="team-players-container">
                                  {citados.team2.length === 0 && (
                                    <div className="team-no-players">
                                      {language === 'en'
                                        ? 'No called players for this team.'
                                        : 'No hay citados para este equipo.'}
                                    </div>
                                  )}
                                  {citados.team2.map((player, idx) => (
                                    <button
                                      key={player.name + player.team}
                                      type="button"
                                      className={`btn ${selectedPlayer && selectedPlayer.name === player.name && selectedPlayer.team === player.team ? 'btn-primary' : 'btn-outline-secondary'} player-button-right`}
                                      onClick={() => setSelectedPlayer(player)}
                                    >
                                      <span className="player-name">{player.name}</span>
                                      <span className="player-team">
                                        ({player.team})
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Paso 3: Formulario de estadísticas */}
                  {selectedPlayer && (
                    <div>
                      <div className="stats-form-group-small">
                        <label className="stats-form-label">
                          {language === 'en' ? 'Sets played (required)' : 'Sets jugados (obligatorio)'}
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="form-control stats-form-input"
                          value={newStats.setsPlayed}
                          onChange={e => setNewStats({ ...newStats, setsPlayed: e.target.value.replace(/\D/g, '') })}
                          min={1}
                          required
                          autoComplete="off"
                          placeholder={language === 'en' ? 'Enter sets played' : 'Ingrese sets jugados'}
                        />
                      </div>
                      
                      {/* Grid para las estadísticas */}
                      <div className="stats-grid">
                        {['blocks', 'assists', 'aces', 'attacks', 'digs', 'hittingErrors', 'kills', 'points'].map(statKey => (
                          <div key={statKey}>
                            <label className="stats-form-label-small">
                              {(() => {
                                const t = texts[language] || texts['es'];
                                switch (statKey) {
                                  case 'blocks': return t?.blocks || 'Bloqueos';
                                  case 'assists': return t?.assists || 'Asistencias';
                                  case 'aces': return t?.aces || 'Aces';
                                  case 'attacks': return t?.attacks || 'Ataques';
                                  case 'digs': return t?.digs || 'Defensas';
                                  case 'hittingErrors': return t?.hitting_errors || 'Errores de golpeo';
                                  case 'kills': return t?.kills || 'Remates';
                                  case 'points': return t?.points || 'Puntos';
                                  default: return statKey;
                                }
                              })()}
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              className="form-control stats-form-input"
                              value={newStats[statKey]}
                              onChange={e =>
                                setNewStats({
                                  ...newStats,
                                  [statKey]: e.target.value.replace(/\D/g, '')
                                })
                              }
                              min={0}
                              autoComplete="off"
                              placeholder={language === 'en' ? 'Enter value' : 'Ingrese valor'}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="stats-modal-footer">
                  <button
                    className="btn btn-secondary stats-modal-button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingStats(null);
                      setSelectedGame(null);
                      setSelectedPlayer(null);
                    }}
                  >
                    {language === 'en' ? 'Cancel' : 'Cancelar'}
                  </button>
                  <button
                    className="btn btn-success stats-modal-button"
                    onClick={handleSaveStats}
                    disabled={!selectedPlayer || !selectedGame || !newStats.setsPlayed || Number(newStats.setsPlayed) < 1}
                    style={{
                      opacity: (!selectedPlayer || !selectedGame || !newStats.setsPlayed || Number(newStats.setsPlayed) < 1) ? 0.6 : 1
                    }}
                  >
                    {editingStats ? 
                      (language === 'en' ? 'Update' : 'Actualizar') :
                      (language === 'en' ? 'Save' : 'Guardar')
                    }
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Gestión de Estadísticas - Implementación personalizada */}
          {showEditModal && (
            <div 
              className="stats-manage-modal-overlay"
              onClick={() => {
                setShowEditModal(false);
                setEditingStats(null);
              }}
            >
              <div 
                className="stats-manage-modal-content"
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div className="stats-modal-header">
                  <h4>
                    {language === 'en' ? 'Manage Game Statistics' : 'Gestionar Estadísticas por Partido'}
                  </h4>
                </div>

                {/* Body */}
                <div className="stats-modal-body">
                  {finishedGames.length === 0 ? (
                    <EmptyState 
                      icon="🏐"
                      title={language === 'en' ? 'No Finished Games' : 'No hay partidos finalizados'}
                      description={language === 'en' 
                        ? 'No finished games available for statistics management.' 
                        : 'No hay partidos finalizados disponibles para gestionar estadísticas.'
                      }
                      language={language}
                    />
                  ) : (
                    <div>
                      {finishedGames.map(game => {
                        const gameStatsForGame = gameStats.filter(stat => stat.gameId === game._id);
                        return (
                          <div key={game._id} className="stats-game-card">
                            <div className="stats-game-card-header">
                              <h6>
                                {game.team1} vs {game.team2} - {game.date}
                              </h6>
                              <span className="stats-game-badge">
                                {gameStatsForGame.length} {language === 'en' ? 'players' : 'jugadores'}
                              </span>
                            </div>
                            <div className="stats-game-card-body">
                              {gameStatsForGame.length === 0 ? (
                                <p className="stats-game-no-data">
                                  {language === 'en' ? 'No statistics recorded for this game.' : 'No hay estadísticas registradas para este partido.'}
                                </p>
                              ) : (
                                <div className="stats-game-table-container">
                                  <table className="table table-sm stats-game-table">
                                    <thead>
                                      <tr>
                                        <th>
                                          {language === 'en' ? 'Player' : 'Jugador'}
                                        </th>
                                        <th>
                                          {language === 'en' ? 'Team' : 'Equipo'}
                                        </th>
                                        <th>
                                          {language === 'en' ? 'Sets' : 'Sets'}
                                        </th>
                                        <th>
                                          {language === 'en' ? 'Points' : 'Puntos'}
                                        </th>
                                        <th>
                                          {language === 'en' ? 'Actions' : 'Acciones'}
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {gameStatsForGame.map(stat => (
                                        <tr key={stat._id}>
                                          <td>
                                            {stat.playerName}
                                          </td>
                                          <td>
                                            {stat.team}
                                          </td>
                                          <td>
                                            {stat.setsPlayed}
                                          </td>
                                          <td>
                                            {stat.points}
                                          </td>
                                          <td>
                                            <button
                                              className="btn btn-outline-primary btn-sm stats-action-button"
                                              onClick={() => handleEditGameStats(stat)}
                                            >
                                              {language === 'en' ? 'Edit' : 'Editar'}
                                            </button>
                                            <button
                                              className="btn btn-outline-danger btn-sm stats-action-button-delete"
                                              onClick={() => handleDeleteGameStats(stat._id)}
                                            >
                                              {language === 'en' ? 'Delete' : 'Eliminar'}
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="stats-modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingStats(null);
                    }}
                  >
                    {language === 'en' ? 'Close' : 'Cerrar'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
};

export default StatsPage;
