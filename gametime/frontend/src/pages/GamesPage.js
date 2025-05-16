import React, { useState, useEffect, useCallback } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../styles/GamePage.css';
import es from 'date-fns/locale/es';
import calendar from '../assets/images/calendario.png';
import texts from '../translations/texts';

const API_TEAMS = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/teams';
const API_LEAGUES = process.env.REACT_APP_API_URL?.replace('/teams', '/leagues') || 'http://localhost:3001/api/leagues';
const API_GAMES = process.env.REACT_APP_API_GAMES_URL || 'http://localhost:3001/api/games';

const GamesPage = ({ language = 'es' }) => {
  // Obtener el rol del usuario desde localStorage
  const [userRole] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user?.esAdmin) return 'admin';
      return user?.tipoCuenta || 'public';
    } catch {
      return 'public';
    }
  });

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);

  // Ligas y equipos
  const [leagues, setLeagues] = useState([]);
  const [activeLeague, setActiveLeague] = useState(null);
  const [teams, setTeams] = useState([]);

  // Partidos de la liga (persistentes)
  const [games, setGames] = useState([]);
  const [form, setForm] = useState({
    team1: '',
    team2: '',
    date: '',
    time: '',
  });
  const [editingGame, setEditingGame] = useState(null);

  // NUEVO: Modal para ver partido (solo para admin/editor)
  const [selectedGame, setSelectedGame] = useState(null);

  // Modal de confirmación para eliminar partido
  const [deleteGameId, setDeleteGameId] = useState(null);

  const fetchLeagues = useCallback(async () => {
    const res = await fetch(API_LEAGUES);
    let data = await res.json();
    if (!Array.isArray(data)) data = [];
    data.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    setLeagues(data);
    if (data.length > 0) setActiveLeague(data[0]._id);
  }, []);

  const fetchTeams = useCallback(async () => {
    const res = await fetch(`${API_TEAMS}?league=${activeLeague}`);
    const data = await res.json();
    setTeams(data.teams || []);
  }, [activeLeague]);

  const fetchGames = useCallback(async () => {
    const res = await fetch(`${API_GAMES}?league=${activeLeague}`);
    const data = await res.json();
    setGames(data.games || []);
  }, [activeLeague]);

  // Cargar ligas al montar
  useEffect(() => {
    fetchLeagues();
  }, [fetchLeagues]);

  useEffect(() => {
    if (activeLeague) {
      fetchTeams();
      fetchGames();
    }
  }, [activeLeague, fetchTeams, fetchGames]);

  // Agrupa los partidos por fecha (yyyy-mm-dd)
  const gamesByDate = React.useMemo(() => {
    const map = {};
    games.forEach(game => {
      if (!map[game.date]) map[game.date] = [];
      map[game.date].push(game);
    });
    return map;
  }, [games]);

  // Obtener los días del mes actual
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Para resaltar días con partidos en el mes actual
  const matchDatesSet = new Set(
    games
      .filter(game => {
        const gameDate = new Date(game.date + 'T00:00:00');
        return (
          gameDate.getFullYear() === currentYear &&
          gameDate.getMonth() === currentMonth
        );
      })
      .map(game => {
        const gameDate = new Date(game.date + 'T00:00:00');
        return gameDate.getDate();
      })
  );

  // Cambiar fecha seleccionada
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setShowModal(false);
  };

  const handleDayClick = (day) => {
    const newDate = new Date(currentYear, currentMonth, day);
    setSelectedDate(newDate);
  };

  // Obtiene la fecha seleccionada en formato yyyy-mm-dd
  const selectedDateString = selectedDate.toISOString().slice(0, 10);

  // Muestra los partidos de la fecha seleccionada
  const filteredGames = gamesByDate[selectedDateString] || [];

  // Formulario agregar/editar partido
  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddOrEditGame = async (e) => {
    e.preventDefault();
    if (!form.team1 || !form.team2 || !form.date || !form.time) return;
    let res;
    if (editingGame && editingGame !== 'new') {
      // Editar partido
      res = await fetch(`${API_GAMES}/${editingGame._id || editingGame}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, league: activeLeague }),
      });
    } else {
      // Crear partido
      res = await fetch(API_GAMES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, league: activeLeague }),
      });
    }
    if (res && res.ok) {
      await fetchGames();
    }
    setForm({ team1: '', team2: '', date: '', time: '' });
    setEditingGame(null);
  };

  const handleEditGame = (game) => {
    setEditingGame(game);
    setForm({
      team1: game.team1,
      team2: game.team2,
      date: game.date,
      time: game.time,
    });
  };

  const handleDeleteGame = (gameId) => {
    setDeleteGameId(gameId);
  };

  const confirmDeleteGame = async () => {
    if (deleteGameId) {
      const res = await fetch(`${API_GAMES}/${deleteGameId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchGames();
      }
      setEditingGame(null);
      setForm({ team1: '', team2: '', date: '', time: '' });
      setDeleteGameId(null);
    }
  };

  const cancelDeleteGame = () => setDeleteGameId(null);

  const handleCancelEdit = () => {
    setEditingGame(null);
    setForm({ team1: '', team2: '', date: '', time: '' });
  };

  // NUEVO: Modal para ver partido (solo para admin/editor)
  const handleShowGame = (game) => {
    setSelectedGame(game);
  };
  const handleCloseGameModal = () => {
    setSelectedGame(null);
  };

  // Bloquear scroll cuando el modal está abierto (igual que TeamsPage)
  useEffect(() => {
    if (selectedGame || editingGame !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [selectedGame, editingGame]);

  // --- Render ---
  // Para admin/editor: solo mostrar el modal de partidos, no el calendario ni la vista pública
  if (userRole === 'admin' || userRole === 'content-editor') {
    return (
      <div className="container mt-5">
        <h2>{language === 'en' ? 'Games' : 'Partidos'}</h2>
        {/* Selector de liga */}
        <div className="mb-4">
          <label className="form-label">{texts[language]?.league_label || (language === 'en' ? 'League:' : 'Liga:')}</label>
          <select
            className="form-select"
            value={activeLeague || ''}
            onChange={e => setActiveLeague(e.target.value)}
            style={{ maxWidth: 300 }}
          >
            {leagues.map(l => (
              <option key={l._id} value={l._id}>{l.name}</option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <button className="btn btn-primary" onClick={() => setEditingGame('new')}>
            {language === 'en' ? 'Add Game' : 'Agregar Partido'}
          </button>
        </div>
        <div className="row justify-content-center">
          {games.map((game, idx) => (
            <div
              key={game._id || idx}
              className="col-md-4 mb-3"
              style={{ cursor: 'pointer' }}
              onClick={() => handleShowGame(game)}
            >
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">
                    {game.team1} {texts[language]?.vs || 'vs'} {game.team2}
                  </h5>
                  <div className="mb-2">
                    <span>{game.date} - {game.time}</span>
                  </div>
                  <div>
                    <span className="score-box">{game.score1 !== null ? game.score1 : '-'}</span>
                    <span style={{ margin: '0 10px' }} />
                    <span className="score-box">{game.score2 !== null ? game.score2 : '-'}</span>
                  </div>
                  <div className="mt-2">
                    <button
                      className="btn btn-outline-secondary btn-sm me-2"
                      onClick={e => { e.stopPropagation(); handleEditGame(game); }}
                    >
                      {language === 'en' ? 'Edit' : 'Editar'}
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={e => { e.stopPropagation(); handleDeleteGame(game._id); }}
                    >
                      {language === 'en' ? 'Delete' : 'Eliminar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Modal para ver partido */}
        {selectedGame && (
          <div className="modal-overlay" onClick={handleCloseGameModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <button
                className="btn btn-secondary close-button"
                onClick={handleCloseGameModal}
              >
                &times;
              </button>
              <h2>{selectedGame.team1} {texts[language]?.vs || 'vs'} {selectedGame.team2}</h2>
              <div className="mb-2">
                <strong>{language === 'en' ? 'Date' : 'Fecha'}:</strong> {selectedGame.date}
              </div>
              <div className="mb-2">
                <strong>{language === 'en' ? 'Time' : 'Hora'}:</strong> {selectedGame.time}
              </div>
              <div className="mb-2">
                <strong>{language === 'en' ? 'Score' : 'Marcador'}:</strong>
                <span className="score-box ms-2">{selectedGame.score1 !== null ? selectedGame.score1 : '-'}</span>
                <span style={{ margin: '0 10px' }} />
                <span className="score-box">{selectedGame.score2 !== null ? selectedGame.score2 : '-'}</span>
              </div>
            </div>
          </div>
        )}
        {/* Modal para agregar/editar partido */}
        {(editingGame !== null) && (
          <div className="modal-overlay" onClick={handleCancelEdit}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <button
                className="btn btn-secondary close-button"
                onClick={handleCancelEdit}
              >
                &times;
              </button>
              <h2>
                {editingGame !== 'new'
                  ? (language === 'en' ? 'Edit Game' : 'Editar Partido')
                  : (language === 'en' ? 'Add Game' : 'Agregar Partido')}
              </h2>
              <form className="row g-2 align-items-end" onSubmit={handleAddOrEditGame}>
                <div className="col-12 mb-2">
                  <label className="form-label">{language === 'en' ? 'Team 1' : 'Equipo 1'}</label>
                  <select
                    className="form-select"
                    name="team1"
                    value={form.team1}
                    onChange={handleFormChange}
                    style={{ minWidth: 220, maxWidth: 350 }}
                  >
                    <option value="">
                      {language === 'en'
                        ? 'Select a team from the list'
                        : 'Selecciona un equipo de la lista'}
                    </option>
                    {teams.map(t => (
                      <option key={t._id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-12 mb-2">
                  <label className="form-label">{language === 'en' ? 'Team 2' : 'Equipo 2'}</label>
                  <select
                    className="form-select"
                    name="team2"
                    value={form.team2}
                    onChange={handleFormChange}
                    style={{ minWidth: 220, maxWidth: 350 }}
                  >
                    <option value="">
                      {language === 'en'
                        ? 'Select a team from the list'
                        : 'Selecciona un equipo de la lista'}
                    </option>
                    {teams.map(t => (
                      <option key={t._id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-6 mb-2">
                  <label className="form-label">{language === 'en' ? 'Date' : 'Fecha'}</label>
                  <input type="date" className="form-control" name="date" value={form.date} onChange={handleFormChange} />
                </div>
                <div className="col-6 mb-2">
                  <label className="form-label">{language === 'en' ? 'Time' : 'Hora'}</label>
                  <input type="time" className="form-control" name="time" value={form.time} onChange={handleFormChange} />
                </div>
                <div className="col-12 mt-3">
                  <button className="btn btn-success" type="submit">
                    {editingGame !== 'new'
                      ? (language === 'en' ? 'Save Changes' : 'Guardar Cambios')
                      : (language === 'en' ? 'Add' : 'Agregar')}
                  </button>
                  <button className="btn btn-secondary ms-2" type="button" onClick={handleCancelEdit}>
                    {language === 'en' ? 'Cancel' : 'Cancelar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Modal de confirmación para eliminar partido */}
        {deleteGameId && (
          <div className="modal-overlay" onClick={cancelDeleteGame}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h4>{language === 'en' ? 'Confirm Deletion' : 'Confirmar Eliminación'}</h4>
              <p>
                {language === 'en'
                  ? 'Are you sure you want to delete this game?'
                  : '¿Seguro que deseas eliminar este partido?'}
              </p>
              <button className="btn btn-danger me-2" onClick={confirmDeleteGame}>
                {language === 'en' ? 'Delete' : 'Eliminar'}
              </button>
              <button className="btn btn-secondary" onClick={cancelDeleteGame}>
                {language === 'en' ? 'Cancel' : 'Cancelar'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- Vista pública (público general) ---
  return (
    <div className="page-container">
      <div className="calendar-header">
        <h3>
          {selectedDate.toLocaleString(language === 'en' ? 'en-US' : 'es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}
        </h3>
      </div>
      <div className="scoreboardDateNav">
        <div className="date-nav-scroll">
          {[...Array(daysInMonth)].map((_, index) => {
            const day = index + 1;
            const isMatchDay = matchDatesSet.has(day);
            return (
              <div
                key={day}
                className={`date-nav-day${selectedDate.getDate() === day ? ' selected-day' : ''}${isMatchDay ? ' highlight-date' : ''}`}
                onClick={() => handleDayClick(day)}
                style={isMatchDay ? { fontWeight: 'bold' } : {}}
              >
                {day}
              </div>
            );
          })}
        </div>
        <div className="calendar-container">
          <button
            className="calendar-icon"
            onClick={() => setShowModal(true)}
          >
            <img src={calendar} alt={language === 'en' ? 'Open calendar' : 'Abrir calendario'} />
          </button>
        </div>
      </div>
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <Calendar
              onChange={handleDateChange}
              value={selectedDate}
              locale={language === 'en' ? undefined : es}
              tileClassName={({ date }) => {
                // Asegura que la fecha sea interpretada correctamente en zona local
                if (
                  date.getFullYear() === currentYear &&
                  date.getMonth() === currentMonth &&
                  matchDatesSet.has(date.getDate())
                ) {
                  return 'highlight-date';
                }
                return null;
              }}
            />
            <button className="close-modal" onClick={() => setShowModal(false)}>
              X
            </button>
          </div>
        </div>
      )}
      {/* Selector de liga - debajo del calendario */}
      <div className="mb-4" style={{ width: '100%', maxWidth: 400 }}>
        <label className="form-label">
          {texts[language]?.league_label || (language === 'en' ? 'League:' : 'Liga:')}
        </label>
        <select
          className="form-select"
          value={activeLeague || ''}
          onChange={e => setActiveLeague(e.target.value)}
        >
          {leagues.map(l => (
            <option key={l._id} value={l._id}>{l.name}</option>
          ))}
        </select>
      </div>
      <div className="games-container">
        {filteredGames.length > 0 ? (
          filteredGames.map((game, index) => (
            <div key={game._id || index} className="game-box">
              <div className="team-names-container">
                {/* Los nombres de los equipos no se traducen */}
                <div className="team-name">{game.team1}</div>
                <div className="vs-text">{texts[language]?.vs || (language === 'en' ? 'vs' : 'vs')}</div>
                <div className="team-name">{game.team2}</div>
              </div>
              <div className="date-time">
                {game.date} - {game.time}
              </div>
              <div className="score-box-container">
                <div className="score-box">{game.score1 !== null ? game.score1 : '-'}</div>
                <div className="score-box">{game.score2 !== null ? game.score2 : '-'}</div>
              </div>
            </div>
          ))
        ) : (
          <p>{language === 'en' ? 'No games scheduled for this date.' : 'No hay partidos programados para esta fecha.'}</p>
        )}
      </div>
    </div>
  );
};

export default GamesPage;
