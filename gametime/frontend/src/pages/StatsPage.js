import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../assets/Configuration/config';
import texts from '../translations/texts';
import '../styles/StatsPage.css';
import LoadingSpinner from '../components/LoadingSpinner';
import { Modal, Button, Form } from 'react-bootstrap'; // Asegúrate de tener react-bootstrap instalado

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
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalCategory, setModalCategory] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [addStatsTeam, setAddStatsTeam] = useState(null);
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

  // Procesa los jugadores de todos los equipos
  const allPlayers = teams.flatMap(team =>
    (team.roster || []).map(player => {
      const stats = player.stats || {};
      return {
        playerName: player.name,
        team: team.name,
        blocks: Number(stats.blocksPerSet ?? 0),
        assists: Number(stats.assistsPerSet ?? 0),
        aces: Number(stats.acesPerSet ?? 0),
        attacks: Number(stats.attacksPerSet ?? 0),
        digs: Number(stats.digsPerSet ?? 0),
        hittingErrors: Number(stats.hittingErrorsPerSet ?? 0), // Si tienes este campo
        kills: Number(stats.killsPerSet ?? 0),
        points: Number(stats.pointsPerSet ?? 0),
      };
    })
  );

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

  // Modal para agregar jugador
  // eslint-disable-next-line no-unused-vars
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [addPlayerTeam, setAddPlayerTeam] = useState(null);
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    stats: {
      acesPerSet: 0,
      assistsPerSet: 0,
      attacksPerSet: 0,
      blocksPerSet: 0,
      digsPerSet: 0,
      hittingPercentage: 0,
      killsPerSet: 0,
      pointsPerSet: 0
    }
  });

  // Handler para abrir modal
  // eslint-disable-next-line no-unused-vars
  const handleOpenAddPlayer = (team) => {
    setAddPlayerTeam(team);
    setNewPlayer({
      name: '',
      stats: {
        acesPerSet: 0,
        assistsPerSet: 0,
        attacksPerSet: 0,
        blocksPerSet: 0,
        digsPerSet: 0,
        hittingPercentage: 0,
        killsPerSet: 0,
        pointsPerSet: 0
      }
    });
    setShowAddPlayerModal(true);
  };

  // Handler para guardar jugador
  // eslint-disable-next-line no-unused-vars
  const handleSavePlayer = async () => {
    if (!addPlayerTeam) return;
    const updatedRoster = [...(addPlayerTeam.roster || []), newPlayer];
    try {
      await fetch(`${API_BASE_URL}/api/teams/${addPlayerTeam._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...addPlayerTeam, roster: updatedRoster })
      });
      // Refresca equipos
      const res = await fetch(`${API_BASE_URL}/api/teams?league=${leagueId}`);
      const data = await res.json();
      setTeams(Array.isArray(data.teams) ? data.teams : []);
      setShowAddPlayerModal(false);
    } catch {
      alert('No se pudo agregar el jugador');
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
    setAddStatsTeam(null);
    setNewStats({
      setsPlayed: 0,
      blocks: 0,
      assists: 0,
      aces: 0,
      attacks: 0,
      digs: 0,
      hittingErrors: 0,
      kills: 0,
      points: 0
    });
  };

  // Guardar estadísticas en el roster del equipo
  const handleSaveStats = async () => {
    if (!selectedPlayer || !addStatsTeam) return;
    // Busca si el jugador ya existe en el roster
    const roster = addStatsTeam.roster || [];
    const idx = roster.findIndex(p => p.name === selectedPlayer.name);
    if (idx < 0) {
      alert(language === 'en'
        ? 'Player must exist in the team roster.'
        : 'El jugador debe existir en el roster del equipo.');
      return;
    }
    let player = { ...roster[idx] };
    // Suma o reemplaza los stats (si vacío, usa 0)
    Object.keys(newStats).forEach(key => {
      const value = newStats[key] === '' ? 0 : Number(newStats[key]);
      if (key === 'setsPlayed') {
        player.stats.setsPlayed = value;
      } else {
        player.stats[key] = value;
      }
    });
    // Calcula promedios por set
    const sets = player.stats.setsPlayed || 1;
    player.stats.acesPerSet = (player.stats.aces || 0) / sets;
    player.stats.assistsPerSet = (player.stats.assists || 0) / sets;
    player.stats.attacksPerSet = (player.stats.attacks || 0) / sets;
    player.stats.blocksPerSet = (player.stats.blocks || 0) / sets;
    player.stats.digsPerSet = (player.stats.digs || 0) / sets;
    player.stats.killsPerSet = (player.stats.kills || 0) / sets;
    player.stats.pointsPerSet = (player.stats.points || 0) / sets;

    const newRoster = [...roster];
    newRoster[idx] = player;
    try {
      await fetch(`${API_BASE_URL}/api/teams/${addStatsTeam._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...addStatsTeam, roster: newRoster })
      });
      // Refresca equipos
      const res = await fetch(`${API_BASE_URL}/api/teams?league=${leagueId}`);
      const data = await res.json();
      setTeams(Array.isArray(data.teams) ? data.teams : []);
      setShowAddModal(false);
    } catch {
      alert('No se pudo guardar la estadística');
    }
  };

  // Cambia: precargar datos existentes al seleccionar jugador
  useEffect(() => {
    if (selectedPlayer && addStatsTeam) {
      // Busca el jugador en el roster
      const roster = addStatsTeam.roster || [];
      const idx = roster.findIndex(p => p.name === selectedPlayer.name);
      if (idx >= 0) {
        const stats = roster[idx].stats || {};
        setNewStats({
          setsPlayed: stats.setsPlayed !== undefined ? String(stats.setsPlayed) : '',
          blocks: stats.blocks !== undefined ? String(stats.blocks) : '',
          assists: stats.assists !== undefined ? String(stats.assists) : '',
          aces: stats.aces !== undefined ? String(stats.aces) : '',
          attacks: stats.attacks !== undefined ? String(stats.attacks) : '',
          digs: stats.digs !== undefined ? String(stats.digs) : '',
          hittingErrors: stats.hittingErrors !== undefined ? String(stats.hittingErrors) : '',
          kills: stats.kills !== undefined ? String(stats.kills) : '',
          points: stats.points !== undefined ? String(stats.points) : '',
        });
      } else {
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
  }, [selectedPlayer, addStatsTeam]);

  // Cuando seleccionas jugador, determina el equipo (sin modificar newStats aquí)
  useEffect(() => {
    if (selectedPlayer && selectedGame) {
      const team = teams.find(t => t.name === selectedPlayer.team);
      setAddStatsTeam(team || null);
    }
  }, [selectedPlayer, selectedGame, teams]);

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
            <div className="mb-3 d-flex justify-content-start">
              <Button
                size="sm"
                variant="primary"
                onClick={() => openAddModal(null)}
              >
                {language === 'en' ? 'Add statistics' : 'Agregar estadísticas'}
              </Button>
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
          {/* Modal para agregar estadística */}
          <Modal
            show={showAddModal}
            onHide={() => setShowAddModal(false)}
            dialogClassName="wide-modal"
          >
            <Modal.Header closeButton>
              <Modal.Title>
                {language === 'en' ? 'Add Statistic' : 'Agregar Estadística'}
                {modalCategory ? ` - ${getLabel(modalCategory.key)}` : ''}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {/* Paso 1: Seleccionar partido finalizado */}
              <Form.Group className="mb-3">
                <Form.Label>{language === 'en' ? 'Select Finished Game' : 'Selecciona un partido finalizado'}</Form.Label>
                <Form.Select
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
                </Form.Select>
              </Form.Group>
              {/* Paso 2: Seleccionar jugador citado */}
              {selectedGame && (
                <div className="mb-3">
                  <Form.Label className="fw-bold">{language === 'en' ? 'Select Player' : 'Selecciona un jugador'}</Form.Label>
                  <div className="row">
                    {(() => {
                      const citados = getCitadosList(selectedGame);
                      return (
                        <>
                          <div className="col-12 col-md-6 mb-2">
                            <div style={{ fontWeight: 'bold', marginBottom: 6, textAlign: 'left' }}>
                              {selectedGame.team1}
                            </div>
                            <div className="d-flex flex-wrap gap-2">
                              {citados.team1.length === 0 && (
                                <div className="text-muted" style={{ fontSize: 13 }}>
                                  {language === 'en'
                                    ? 'No called players for this team.'
                                    : 'No hay citados para este equipo.'}
                                </div>
                              )}
                              {citados.team1.map((player, idx) => (
                                <Button
                                  type="button"
                                  variant={selectedPlayer && selectedPlayer.name === player.name && selectedPlayer.team === player.team ? 'primary' : 'outline-secondary'}
                                  className="mb-2 flex-grow-1"
                                  style={{ minWidth: 120, textAlign: 'left', whiteSpace: 'normal' }}
                                  key={player.name + player.team}
                                  onClick={() => setSelectedPlayer(player)}
                                >
                                  <span className="fw-bold">{player.name}</span>
                                  <span className="ms-2 text-muted" style={{ fontSize: 13 }}>
                                    ({player.team})
                                  </span>
                                </Button>
                              ))}
                            </div>
                          </div>
                          <div className="col-12 col-md-6 mb-2">
                            <div style={{ fontWeight: 'bold', marginBottom: 6, textAlign: 'right' }}>
                              {selectedGame.team2}
                            </div>
                            <div className="d-flex flex-wrap gap-2 justify-content-md-end">
                              {citados.team2.length === 0 && (
                                <div className="text-muted" style={{ fontSize: 13 }}>
                                  {language === 'en'
                                    ? 'No called players for this team.'
                                    : 'No hay citados para este equipo.'}
                                </div>
                              )}
                              {citados.team2.map((player, idx) => (
                                <Button
                                  type="button"
                                  variant={selectedPlayer && selectedPlayer.name === player.name && selectedPlayer.team === player.team ? 'primary' : 'outline-secondary'}
                                  className="mb-2 flex-grow-1"
                                  style={{ minWidth: 120, textAlign: 'right', whiteSpace: 'normal' }}
                                  key={player.name + player.team}
                                  onClick={() => setSelectedPlayer(player)}
                                >
                                  <span className="fw-bold">{player.name}</span>
                                  <span className="ms-2 text-muted" style={{ fontSize: 13 }}>
                                    ({player.team})
                                  </span>
                                </Button>
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
                <Form>
                  <Form.Group className="mb-2">
                    <Form.Label>
                      {language === 'en' ? 'Sets played (required)' : 'Sets jugados (obligatorio)'}
                    </Form.Label>
                    <Form.Control
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={newStats.setsPlayed}
                      onChange={e => setNewStats({ ...newStats, setsPlayed: e.target.value.replace(/\D/g, '') })}
                      min={1}
                      required
                      autoComplete="off"
                      placeholder={language === 'en' ? 'Enter sets played' : 'Ingrese sets jugados'}
                    />
                  </Form.Group>
                  {/* Campos de estadísticas SIN "por set" en el label */}
                  {['blocks', 'assists', 'aces', 'attacks', 'digs', 'hittingErrors', 'kills', 'points'].map(statKey => (
                    <Form.Group className="mb-2" key={statKey}>
                      <Form.Label>
                        {(() => {
                          // Solo el nombre base, sin "por set"
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
                      </Form.Label>
                      <Form.Control
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
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
                    </Form.Group>
                  ))}
                </Form>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                {language === 'en' ? 'Cancel' : 'Cancelar'}
              </Button>
              <Button
                variant="success"
                onClick={handleSaveStats}
                disabled={!selectedPlayer || !selectedGame || !newStats.setsPlayed || Number(newStats.setsPlayed) < 1}
              >
                {language === 'en' ? 'Save' : 'Guardar'}
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      )}
    </div>
  );
};

export default StatsPage;
