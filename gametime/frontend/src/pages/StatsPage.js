import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../assets/Configuration/config';
import texts from '../translations/texts';
import '../styles/StatsPage.css';
import LoadingSpinner from '../components/LoadingSpinner';

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

const tableColors = [
  "primary", "success", "warning", "danger", "info", "secondary", "dark", "light"
];

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

  const [playerStats, setPlayerStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedStats, setEditedStats] = useState([]);
  const [newStat, setNewStat] = useState({
    playerName: '',
    team: '',
    acesPerSet: 0,
    assistsPerSet: 0,
    attacksPerSet: 0,
    blocksPerSet: 0,
    digsPerSet: 0,
    hittingPercentage: 0,
    killsPerSet: 0,
    pointsPerSet: 0,
  });
  const [teams, setTeams] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [games, setGames] = useState([]); // <-- Agrega esta línea
  const [localActiveLeague, setLocalActiveLeague] = useState(() => {
    // Guardar y recuperar la liga activa desde sessionStorage
    return sessionStorage.getItem('statsActiveLeague') || null;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [addingCategory, setAddingCategory] = useState(null);
  const [newRow, setNewRow] = useState({});

  // Nuevo: estado para mostrar el modal y la categoría activa
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalCategory, setModalCategory] = useState(null);

  // Nuevo: estado para partido y jugador seleccionado en el modal
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const leagueId = activeLeague || localActiveLeague;

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
    };
    fetchTeams().finally(() => setLoading(false));
  }, [leagueId]);

  useEffect(() => {
    setLoading(true);
    const fetchStats = async () => {
      try {
        const url = leagueId
          ? `${API_BASE_URL}/api/player-stats?league=${leagueId}`
          : `${API_BASE_URL}/api/player-stats`;
        const res = await fetch(url);
        const data = await res.json();
        const stats = Array.isArray(data) ? data : [];
        setPlayerStats(stats);
        setEditedStats(stats);
      } catch {
        setPlayerStats([]);
        setEditedStats([]);
      }
      setLoading(false);
    };
    fetchStats().finally(() => setLoading(false));
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
    };
    fetchGames().finally(() => setLoading(false));
  }, [leagueId]);

  // Nueva: manejar cambio en inputs de la fila de agregar
  const handleNewRowChange = (catKey, field, value) => {
    setNewRow(prev => ({
      ...prev,
      [catKey]: {
        ...prev[catKey],
        [field]: value
      }
    }));
  };

  // Nueva función para abrir el modal
  const openAddModal = (cat) => {
    setModalCategory(cat);
    setShowAddModal(true);
    setNewRow(prev => ({
      ...prev,
      [cat.key]: getInitialNewRow(cat)
    }));
  };

  // Nueva función para cerrar el modal
  const closeAddModal = () => {
    setShowAddModal(false);
    setModalCategory(null);
  };

  // Modifica handleAddRow para cerrar el modal
  const handleAddRow = async (cat) => {
    const row = { ...newRow[cat.key] };
    // Asegura los campos requeridos
    row.playerName = row.playerName || '';
    row.team = row.team || '';
    row.league = leagueId; // debe ser el _id de la liga como string

    // Asegura que todos los campos numéricos sean números
    [
      'blocks', 'assists', 'aces', 'attacks', 'digs', 'hittingErrors', 'kills', 'points', 'setsPlayed'
    ].forEach(k => { row[k] = Number(row[k]) || 0; });

    try {
      await fetch(`${API_BASE_URL}/api/player-stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(row),
      });
      // Refresca las estadísticas desde el backend para mantener consistencia
      const url = leagueId
        ? `${API_BASE_URL}/api/player-stats?league=${leagueId}`
        : `${API_BASE_URL}/api/player-stats`;
      const res = await fetch(url);
      const data = await res.json();
      const stats = Array.isArray(data) ? data : [];
      setPlayerStats(stats);
      setEditedStats(stats);
    } catch (err) {
      // Opcional: mostrar error al usuario
      alert('No se pudo guardar la estadística en el servidor');
    }

    setShowAddModal(false);
    setModalCategory(null);
    setNewRow(prev => ({ ...prev, [cat.key]: getInitialNewRow(cat) }));
  };

  const filteredStats = (statsArray) => {
    // Filtra SOLO las estadísticas de la liga activa
    const filtered = statsArray.filter(p =>
      (!leagueId || (p.league && (p.league._id === leagueId || p.league === leagueId))) &&
      (
        !searchQuery ||
        p.playerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.team?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
    return filtered;
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
      case 'blocks': return t?.blocks || 'Bloqueos';
      case 'assists': return t?.assists || 'Asistencias';
      case 'aces': return t?.aces || 'Aces';
      case 'attacks': return t?.attacks || 'Ataques';
      case 'digs': return t?.digs || 'Defensas';
      case 'hittingErrors': return t?.hitting_errors || 'Errores de golpeo';
      case 'kills': return t?.kills || 'Remates';
      case 'points': return t?.points || 'Puntos';
      // ...otros casos si agregas más estadísticas...
      default: return key;
    }
  };

  // Obtener lista de partidos finalizados
  const finishedGames = games.filter(g => g.partidoFinalizado);

  // Obtener citados del partido seleccionado
  const getCitadosList = (game) => {
    if (!game) return [];
    // citados es string separado por coma
    const citadosArr = (game.citados || '').split(',').map(s => s.trim()).filter(Boolean);
    // Buscar en roster de ambos equipos
    const team1 = teams.find(t => t.name === game.team1);
    const team2 = teams.find(t => t.name === game.team2);
    // roster puede ser array de objetos o strings
    const roster1 = (team1?.roster || []).filter(p => {
      const playerName = typeof p === 'string' ? p : p.name;
      return citadosArr.includes(playerName);
    });
    const roster2 = (team2?.roster || []).filter(p => {
      const playerName = typeof p === 'string' ? p : p.name;
      return citadosArr.includes(playerName);
    });
    // Devuelve [{name, team}]
    return [
      ...roster1.map(p => ({
        name: typeof p === 'string' ? p : p.name,
        team: team1?.name || game.team1
      })),
      ...roster2.map(p => ({
        name: typeof p === 'string' ? p : p.name,
        team: team2?.name || game.team2
      }))
    ];
  };

  // Cuando seleccionas un jugador, llena los campos playerName y team
  useEffect(() => {
    if (modalCategory && selectedPlayer) {
      setNewRow(prev => ({
        ...prev,
        [modalCategory.key]: {
          ...getInitialNewRow(modalCategory),
          playerName: selectedPlayer.name,
          team: selectedPlayer.team
        }
      }));
    }
  }, [selectedPlayer, modalCategory]);

  // Agrega esta función antes de cualquier uso de getInitialNewRow
  const getInitialNewRow = (cat) => {
    const row = {};
    cat.columns.forEach(col => {
      row[col.key] = col.key === 'playerName' || col.key === 'team' ? '' : 0;
    });
    // Agrega campo para sets jugados
    row.setsPlayed = 0;
    return row;
  };

  // Al mostrar la tabla, calcula los valores "por set" automáticamente
  const getPerSetValue = (stat, key) => {
    if (!stat.setsPlayed || stat.setsPlayed === 0) return 0;
    return (stat[key] / stat.setsPlayed).toFixed(2);
  };

  return (
    <div className="stats-container">
      {loading && <LoadingSpinner />}
      {!loading && (
        <>
          <h2 className="stats-title">
            {texts[language]?.navbar_statistics || 'Estadísticas'}
          </h2>
          <div className="stats-league-selector">
            <label className="me-2 fw-bold">{texts[language]?.league_label || 'Liga:'}</label>
            {/* Cambia el select por un onChange que NO use e.preventDefault() */}
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
          {loading ? (
            <div className="alert alert-info">
              {texts[language]?.loading_stats || 'Cargando estadísticas...'}
            </div>
          ) : (
            <div>
              {groupedCategories.map((catPair, rowIdx) => (
                <div className="row mb-4" key={rowIdx}>
                  {catPair.map((cat, i) => {
                    const stats = filteredStats(playerStats)
                      .filter(p => typeof p[cat.key] === 'number')
                      .sort((a, b) => b[cat.key] - a[cat.key]);
                    return (
                      <div className="col-md-6 mb-4" key={cat.key}>
                        <div className="card stats-table-card">
                          <div className="card-header stats-table-header d-flex justify-content-between align-items-center">
                            <h4 className="mb-0 fs-5">{getLabel(cat.key)}</h4>
                            {isEditor && (
                              <button
                                className="btn btn-sm btn-primary" // <-- siempre azul
                                onClick={() => openAddModal(cat)}
                              >
                                {language === 'en' ? 'Add' : 'Agregar'}
                              </button>
                            )}
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
                                  {/* Elimina la fila inline de agregar */}
                                  {/* Fin fila agregar */}
                                  {stats.length === 0 ? (
                                    <tr>
                                      <td colSpan={cat.columns.length + 1} className="text-center text-muted">
                                        {texts[language]?.no_stats_data || 'No hay datos de estadísticas disponibles.'}
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
                                            {/* Solo muestra el total, NO el valor por set */}
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
          )}
          {/* Modal para agregar estadística */}
          {showAddModal && modalCategory && (
            <div className="modal-overlay" style={{
              position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
              background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div className="modal-content" style={{
                background: '#fff', borderRadius: 8, padding: 24, minWidth: 320, maxWidth: 600, width: '100%', position: 'relative'
              }}>
                <button
                  className="btn btn-secondary close-button"
                  style={{ position: 'absolute', top: 10, right: 10 }}
                  onClick={() => {
                    closeAddModal();
                    setSelectedGame(null);
                    setSelectedPlayer(null);
                  }}
                >
                  &times;
                </button>
                <h4 style={{ marginBottom: 20 }}>
                  {language === 'en' ? 'Add Statistic' : 'Agregar Estadística'} - {getLabel(modalCategory.key)}
                </h4>
                {/* Paso 1: Seleccionar partido finalizado */}
                <div className="mb-3">
                  <label className="form-label fw-bold">{language === 'en' ? 'Select Finished Game' : 'Selecciona un partido finalizado'}</label>
                  <select
                    className="form-select"
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
                  <div className="mb-3">
                    <label className="form-label fw-bold">{language === 'en' ? 'Select Player' : 'Selecciona un jugador'}</label>
                    <div className="row">
                      {/* Mostrar jugadores citados separados por equipo, igual que en GamesPage */}
                      <div className="col-6">
                        <div style={{ fontWeight: 'bold', marginBottom: 6, textAlign: 'left' }}>
                          {selectedGame.team1}
                        </div>
                        {getCitadosList(selectedGame)
                          .filter(player => player.team === selectedGame.team1)
                          .map((player, idx) => (
                            <button
                              type="button"
                              className={`btn btn-outline-${selectedPlayer && selectedPlayer.name === player.name && selectedPlayer.team === player.team ? 'primary' : 'secondary'} w-100 mb-2`}
                              style={{ textAlign: 'left' }}
                              key={player.name + player.team}
                              onClick={() => setSelectedPlayer(player)}
                            >
                              <span className="fw-bold">{player.name}</span>
                              <span className="ms-2 text-muted" style={{ fontSize: 13 }}>
                                ({player.team})
                              </span>
                            </button>
                          ))}
                        {getCitadosList(selectedGame).filter(player => player.team === selectedGame.team1).length === 0 && (
                          <div className="text-muted" style={{ fontSize: 13 }}>
                            {language === 'en'
                              ? 'No called players for this team.'
                              : 'No hay citados para este equipo.'}
                          </div>
                        )}
                      </div>
                      <div className="col-6">
                        <div style={{ fontWeight: 'bold', marginBottom: 6, textAlign: 'right' }}>
                          {selectedGame.team2}
                        </div>
                        {getCitadosList(selectedGame)
                          .filter(player => player.team === selectedGame.team2)
                          .map((player, idx) => (
                            <button
                              type="button"
                              className={`btn btn-outline-${selectedPlayer && selectedPlayer.name === player.name && selectedPlayer.team === player.team ? 'primary' : 'secondary'} w-100 mb-2`}
                              style={{ textAlign: 'right' }}
                              key={player.name + player.team}
                              onClick={() => setSelectedPlayer(player)}
                            >
                              <span className="fw-bold">{player.name}</span>
                              <span className="ms-2 text-muted" style={{ fontSize: 13 }}>
                                ({player.team})
                              </span>
                            </button>
                          ))}
                        {getCitadosList(selectedGame).filter(player => player.team === selectedGame.team2).length === 0 && (
                          <div className="text-muted" style={{ fontSize: 13, textAlign: 'right' }}>
                            {language === 'en'
                              ? 'No called players for this team.'
                              : 'No hay citados para este equipo.'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {/* Paso 3: Formulario de estadísticas */}
                {selectedPlayer && (
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      handleAddRow(modalCategory);
                      setSelectedGame(null);
                      setSelectedPlayer(null);
                    }}
                  >
                    <div className="row g-2">
                      {modalCategory.columns.map(col => (
                        <div className="col-12" key={col.key}>
                          <label className="form-label">{getLabel(col.key)}</label>
                          {col.key === 'playerName' || col.key === 'team' ? (
                            <input
                              type="text"
                              className="form-control"
                              value={newRow[modalCategory.key]?.[col.key] || ''}
                              readOnly
                            />
                          ) : (
                            <input
                              type="number"
                              className="form-control"
                              value={newRow[modalCategory.key]?.[col.key] || 0}
                              onChange={e =>
                                handleNewRowChange(modalCategory.key, col.key, Number(e.target.value))
                              }
                              step="1"
                              min="0"
                              placeholder={getLabel(col.key)}
                              required
                            />
                          )}
                        </div>
                      ))}
                      {/* Campo para sets jugados */}
                      <div className="col-12">
                        <label className="form-label">{language === 'en' ? 'Sets played' : 'Sets jugados'}</label>
                        <input
                          type="number"
                          className="form-control"
                          value={newRow[modalCategory.key]?.setsPlayed || 0}
                          onChange={e =>
                            handleNewRowChange(modalCategory.key, 'setsPlayed', Number(e.target.value))
                          }
                          step="1"
                          min="1"
                          required
                        />
                      </div>
                    </div>
                    <div className="mt-3 d-flex justify-content-end">
                      <button
                        className="btn btn-success me-2"
                        type="submit"
                      >
                        {language === 'en' ? 'Save' : 'Guardar'}
                      </button>
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => {
                          setSelectedPlayer(null);
                        }}
                      >
                        {language === 'en' ? 'Back' : 'Volver'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StatsPage;

// NOTA IMPORTANTE:
// Tu backend tiene dos formas de almacenar estadísticas:
// 1. En la colección playerstats (para estadísticas históricas y por partido).
