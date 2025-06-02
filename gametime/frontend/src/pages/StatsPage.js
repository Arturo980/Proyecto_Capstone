import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../assets/Configuration/config';
import texts from '../translations/texts';
import '../styles/StatsPage.css';

const STAT_CATEGORIES = [
  {
    key: 'blocksPerSet',
    label: 'Bloqueos por set',
    columns: [
      { key: 'playerName', label: 'Jugador' },
      { key: 'team', label: 'Equipo' },
      { key: 'blocksPerSet', label: 'Bloqueos por set' }
    ]
  },
  {
    key: 'assistsPerSet',
    label: 'Asistencias por set',
    columns: [
      { key: 'playerName', label: 'Jugador' },
      { key: 'team', label: 'Equipo' },
      { key: 'assistsPerSet', label: 'Asistencias por set' }
    ]
  },
  {
    key: 'acesPerSet',
    label: 'Aces por set',
    columns: [
      { key: 'playerName', label: 'Jugador' },
      { key: 'team', label: 'Equipo' },
      { key: 'acesPerSet', label: 'Aces por set' }
    ]
  },
  {
    key: 'attacksPerSet',
    label: 'Ataques por set',
    columns: [
      { key: 'playerName', label: 'Jugador' },
      { key: 'team', label: 'Equipo' },
      { key: 'attacksPerSet', label: 'Ataques por set' }
    ]
  },
  {
    key: 'digsPerSet',
    label: 'Defensas por set',
    columns: [
      { key: 'playerName', label: 'Jugador' },
      { key: 'team', label: 'Equipo' },
      { key: 'digsPerSet', label: 'Defensas por set' }
    ]
  },
  {
    key: 'hittingPercentage',
    label: '% Golpeo',
    columns: [
      { key: 'playerName', label: 'Jugador' },
      { key: 'team', label: 'Equipo' },
      { key: 'hittingPercentage', label: '% Golpeo' }
    ]
  },
  {
    key: 'killsPerSet',
    label: 'Remates por set',
    columns: [
      { key: 'playerName', label: 'Jugador' },
      { key: 'team', label: 'Equipo' },
      { key: 'killsPerSet', label: 'Remates por set' }
    ]
  },
  {
    key: 'pointsPerSet',
    label: 'Puntos por set',
    columns: [
      { key: 'playerName', label: 'Jugador' },
      { key: 'team', label: 'Equipo' },
      { key: 'pointsPerSet', label: 'Puntos por set' }
    ]
  }
];

const tableColors = [
  "primary", "success", "warning", "danger", "info", "secondary", "dark", "light"
];

const StatsPage = ({ language = 'es', activeLeague, user, onLeagueChange }) => {
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
  const [localActiveLeague, setLocalActiveLeague] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const isEditor = user && (
    user.role === 'admin' ||
    user.role === 'content_editor' ||
    user.tipoCuenta === 'admin' ||
    user.tipoCuenta === 'content-editor' ||
    user.esAdmin
  );
  const leagueId = activeLeague || localActiveLeague;

  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/leagues`);
        const data = await res.json();
        const leagueList = Array.isArray(data) ? data : data.leagues || [];
        setLeagues(leagueList);
        if (!activeLeague && leagueList.length > 0) setLocalActiveLeague(leagueList[0]._id);
      } catch {
        setLeagues([]);
      }
    };
    fetchLeagues();
  }, [activeLeague]);

  useEffect(() => {
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
    fetchTeams();
  }, [leagueId]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
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
    fetchStats();
  }, [leagueId]);

  const handleEdit = () => {
    setEditing(true);
    setEditedStats([...playerStats]);
  };

  const handleCancel = () => {
    setEditing(false);
    setEditedStats([...playerStats]);
  };

  const handleChange = (idx, field, value) => {
    const updated = editedStats.map((row, i) =>
      i === idx ? { ...row, [field]: value } : row
    );
    setEditedStats(updated);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE_URL}/api/player-stats`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedStats),
      });
      setPlayerStats([...editedStats]);
      setEditing(false);
    } catch {}
    setLoading(false);
  };

  const handleNewStatChange = (field, value) => {
    setNewStat(prev => ({ ...prev, [field]: value }));
  };

  const handleAddNewStat = () => {
    setEditedStats([...editedStats, { ...newStat }]);
    setNewStat({
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
  };

  const filteredStats = (statsArray) => {
    if (!searchQuery) return statsArray;
    return statsArray.filter(p =>
      p.playerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.team?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const groupedCategories = [];
  for (let i = 0; i < STAT_CATEGORIES.length; i += 2) {
    groupedCategories.push(STAT_CATEGORIES.slice(i, i + 2));
  }

  // Traducción de headers de tabla
  const getLabel = (key) => {
    const t = texts[language];
    switch (key) {
      case 'playerName': return t?.player_name || 'Jugador';
      case 'team': return t?.team || 'Equipo';
      case 'blocksPerSet': return t?.blocks_per_set || 'Bloqueos por set';
      case 'assistsPerSet': return t?.assists_per_set || 'Asistencias por set';
      case 'acesPerSet': return t?.aces_per_set || 'Aces por set';
      case 'attacksPerSet': return t?.attacks_per_set || 'Ataques por set';
      case 'digsPerSet': return t?.digs_per_set || 'Defensas por set';
      case 'hittingPercentage': return t?.hitting_percentage || '% Golpeo';
      case 'killsPerSet': return t?.kills_per_set || 'Remates por set';
      case 'pointsPerSet': return t?.points_per_set || 'Puntos por set';
      default: return key;
    }
  };

  return (
    <div className="stats-container">
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
      {/* Botón para agregar estadísticas */}
      {isEditor && !editing && (
        <div className="mb-3">
          <button className="btn btn-primary" type="button" onClick={handleEdit}>
            {language === 'en' ? 'Add/Edit Statistics' : 'Agregar/Editar Estadísticas'}
          </button>
        </div>
      )}
      <div className="stats-search mb-4">
        <input
          type="text"
          className="form-control"
          placeholder={texts[language]?.search_player_team || "Buscar jugador o equipo"}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {isEditor && teams.length > 0 && (
        <div className="mb-4">
          <h2 className="stats-section-title">
            {texts[language]?.navbar_statistics || 'Estadísticas individuales'}
          </h2>
          <div className="row">
            {teams.map(team => (
              <div key={team._id} className="col-md-4 mb-3">
                <div className="card h-100">
                  {team.logo && (
                    <img
                      src={team.logo}
                      className="card-img-top team-logo-img"
                      alt={team.name}
                      style={{ maxHeight: 120, objectFit: 'contain', background: '#f8f9fa' }}
                    />
                  )}
                  <div className="card-body">
                    <h5 className="card-title">{team.name}</h5>
                    <ul className="mb-0" style={{ listStyle: 'none', paddingLeft: 0 }}>
                      {(team.roster || []).map((player, idx) => (
                        <li key={idx} style={{ fontSize: 15 }}>
                          {player.name || player}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isEditor && !editing && (
        <button className="btn btn-primary mb-2" onClick={handleEdit}>
          Editar estadísticas
        </button>
      )}
      {isEditor && editing && (
        <div className="mb-2">
          <button className="btn btn-success me-2" onClick={handleSave}>
            Guardar
          </button>
          <button className="btn btn-secondary me-2" onClick={handleCancel}>
            Cancelar
          </button>
        </div>
      )}
      {isEditor && editing && (
        <div className="card card-body mb-3">
          <h5>Agregar nueva estadística</h5>
          <div className="row g-2">
            <div className="col">
              <input
                type="text"
                className="form-control"
                placeholder="Jugador"
                value={newStat.playerName}
                onChange={e => handleNewStatChange('playerName', e.target.value)}
              />
            </div>
            <div className="col">
              <input
                type="text"
                className="form-control"
                placeholder="Equipo"
                value={newStat.team}
                onChange={e => handleNewStatChange('team', e.target.value)}
              />
            </div>
            <div className="col">
              <input
                type="number"
                className="form-control"
                placeholder="Aces"
                value={newStat.acesPerSet}
                onChange={e => handleNewStatChange('acesPerSet', Number(e.target.value))}
                step="0.01"
              />
            </div>
            <div className="col">
              <input
                type="number"
                className="form-control"
                placeholder="Asistencias"
                value={newStat.assistsPerSet}
                onChange={e => handleNewStatChange('assistsPerSet', Number(e.target.value))}
                step="0.01"
              />
            </div>
            <div className="col">
              <input
                type="number"
                className="form-control"
                placeholder="Ataques"
                value={newStat.attacksPerSet}
                onChange={e => handleNewStatChange('attacksPerSet', Number(e.target.value))}
                step="0.01"
              />
            </div>
            <div className="col">
              <input
                type="number"
                className="form-control"
                placeholder="Bloqueos"
                value={newStat.blocksPerSet}
                onChange={e => handleNewStatChange('blocksPerSet', Number(e.target.value))}
                step="0.01"
              />
            </div>
            <div className="col">
              <input
                type="number"
                className="form-control"
                placeholder="Defensas"
                value={newStat.digsPerSet}
                onChange={e => handleNewStatChange('digsPerSet', Number(e.target.value))}
                step="0.01"
              />
            </div>
            <div className="col">
              <input
                type="number"
                className="form-control"
                placeholder="% Golpeo"
                value={newStat.hittingPercentage}
                onChange={e => handleNewStatChange('hittingPercentage', Number(e.target.value))}
                step="0.0001"
                min="0"
                max="1"
              />
            </div>
            <div className="col">
              <input
                type="number"
                className="form-control"
                placeholder="Remates"
                value={newStat.killsPerSet}
                onChange={e => handleNewStatChange('killsPerSet', Number(e.target.value))}
                step="0.01"
              />
            </div>
            <div className="col">
              <input
                type="number"
                className="form-control"
                placeholder="Puntos"
                value={newStat.pointsPerSet}
                onChange={e => handleNewStatChange('pointsPerSet', Number(e.target.value))}
                step="0.01"
              />
            </div>
            <div className="col-auto">
              <button className="btn btn-info" type="button" onClick={handleAddNewStat}>
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
      {loading ? (
        <div className="alert alert-info">
          {texts[language]?.loading_stats || 'Cargando estadísticas...'}
        </div>
      ) : (
        <div>
          {groupedCategories.map((catPair, rowIdx) => (
            <div className="row mb-4" key={rowIdx}>
              {catPair.map((cat, i) => {
                const stats = filteredStats(editing ? editedStats : playerStats)
                  .filter(p => typeof p[cat.key] === 'number')
                  .sort((a, b) => b[cat.key] - a[cat.key]);
                return (
                  <div className="col-md-6 mb-4" key={cat.key}>
                    <div className="card stats-table-card">
                      <div className="card-header stats-table-header">
                        <h4 className="mb-0 fs-5">{getLabel(cat.key)}</h4>
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
                                        {col.key === 'hittingPercentage' ? (
                                          <span className="badge bg-light text-dark">
                                            {(p[col.key] * 100).toFixed(1)}%
                                          </span>
                                        ) : (
                                          <span className="fw-semibold">{p[col.key]}</span>
                                        )}
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
    </div>
  );
};

export default StatsPage;
