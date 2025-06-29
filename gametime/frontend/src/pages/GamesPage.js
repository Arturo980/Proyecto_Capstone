import React, { useState, useEffect, useCallback } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../styles/GamePage.css';
import es from 'date-fns/locale/es';
import texts from '../translations/texts';
import { io as socketIOClient } from "socket.io-client";
import LiveScoreModal from '../components/LiveScoreModal';
import BeforeMatch from '../components/BeforeMatch';
import DuringMatch from '../components/DuringMatch';
import AfterMatch from '../components/AfterMatch';
import { API_BASE_URL } from '../assets/Configuration/config';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';

const API_TEAMS = `${API_BASE_URL}/api/teams`;
const API_LEAGUES = `${API_BASE_URL}/api/leagues`;
const API_GAMES = `${API_BASE_URL}/api/games`;
const SOCKET_URL = API_BASE_URL;

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

  // Añade esta línea para definir canEditMatchData
  const canEditMatchData = userRole === 'admin' || userRole === 'match-manager';
  const canEditCitadosAndSets = userRole === 'admin';

  // NUEVO: Estado para modales separados
  const [editConfigGame, setEditConfigGame] = useState(null); // Para editar configuración (equipos, fecha, hora)
  const [editScoreGame, setEditScoreGame] = useState(null);   // Para editar marcador

  // NUEVO: Estado para citados seleccionados
  const [selectedCitados, setSelectedCitados] = useState([]);

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
    citados: '', // NUEVO: citados (string, puede ser lista separada por comas)
    score1: '',  // NUEVO: marcador de puntos equipo 1
    score2: '',  // NUEVO: marcador de puntos equipo 2
    sets1: '',   // NUEVO: sets ganados equipo 1
    sets2: '',   // NUEVO: sets ganados equipo 2
  });
  const [editingGame, setEditingGame] = useState(null);

  // NUEVO: Modal para ver partido (solo para admin/editor)
  const [selectedGame, setSelectedGame] = useState(null);

  // Modal de confirmación para eliminar partido
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [gameToDelete, setGameToDelete] = useState(null);

  // NUEVO: Estado para el partido que se está editando el marcador en vivo
  const [liveScoreGame, setLiveScoreGame] = useState(null);

  // NUEVO: Estado para sets jugados en el partido en vivo
  const [liveSets, setLiveSets] = useState([]); // [{score1, score2}]
  const [currentSetScore, setCurrentSetScore] = useState({ score1: 0, score2: 0 });

  // NUEVO: Estado para configuración de sets de la liga activa
  const [leagueConfig, setLeagueConfig] = useState({ setsToWin: 3, lastSetPoints: 15 });

  // Estado de carga
  const [loading, setLoading] = useState(true);

  // Actualiza leagueConfig cuando cambia la liga activa o las ligas
  useEffect(() => {
    if (activeLeague && leagues.length > 0) {
      const liga = leagues.find(l => l._id === activeLeague);
      if (liga) {
        setLeagueConfig({
          setsToWin: liga.setsToWin ?? 3,
          lastSetPoints: liga.lastSetPoints ?? 15
        });
      }
    }
  }, [activeLeague, leagues]);

  const fetchLeagues = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API_LEAGUES);
      if (!res.ok) {
        console.error('Error al obtener ligas:', res.status, res.statusText);
        setLeagues([]);
        return;
      }
      let data = await res.json();
      if (!Array.isArray(data)) data = [];
      data.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
      setLeagues(data);
      if (data.length > 0) setActiveLeague(data[0]._id);
    } catch (err) {
      console.error('No se pudo conectar con el backend para obtener ligas:', err.message);
      setLeagues([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_TEAMS}?league=${activeLeague}`);
      if (!res.ok) {
        console.error('Error al obtener equipos:', res.status, res.statusText);
        setTeams([]);
        return;
      }
      const data = await res.json();
      setTeams(data.teams || []);
    } catch (err) {
      console.error('No se pudo conectar con el backend para obtener equipos:', err.message);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, [activeLeague]);

  // Cambia fetchGames para manejar errores de red y mostrar un mensaje claro en consola
  const fetchGames = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_GAMES}?league=${activeLeague}`);
      if (!res.ok) {
        console.error('Error al obtener partidos:', res.status, res.statusText);
        setGames([]);
        return;
      }
      const data = await res.json();
      setGames(data.games || []);
    } catch (err) {
      console.error('No se pudo conectar con el backend para obtener partidos:', err.message);
      setGames([]);
    } finally {
      setLoading(false);
    }
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

  // Encuentra el roster de los equipos seleccionados
  const team1Obj = teams.find(t => t.name === form.team1);
  const team2Obj = teams.find(t => t.name === form.team2);
  const roster1 = team1Obj?.roster || [];
  const roster2 = team2Obj?.roster || [];

  // Cuando cambia el equipo seleccionado, limpia los citados
  useEffect(() => {
    setSelectedCitados([]);
  }, [form.team1, form.team2, editingGame]);

  // Cuando se edita un partido existente, carga los citados
  useEffect(() => {
    if (editingGame && editingGame !== 'new' && editingGame.citados) {
      setSelectedCitados(
        editingGame.citados
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
      );
    }
  }, [editingGame]);

  // Maneja el cambio de selección de citados
  const handleCitadoToggle = (player) => {
    setSelectedCitados(prev =>
      prev.includes(player)
        ? prev.filter(p => p !== player)
        : [...prev, player]
    );
  };

  // Maneja abrir modal de configuración
  const handleEditConfigGame = (game) => {
    setEditConfigGame(game);
    setForm({
      team1: game.team1,
      team2: game.team2,
      date: game.date,
      time: game.time,
      // No marcador ni sets ni citados aquí
    });
  };

  // Maneja abrir modal de marcador
  // eslint-disable-next-line no-unused-vars
  const handleEditScoreGame = (game) => {
    setEditScoreGame(game);
    setForm({
      score1: game.score1 !== null ? game.score1 : '',
      score2: game.score2 !== null ? game.score2 : '',
      // Solo admin puede editar sets y citados
      sets1: canEditCitadosAndSets ? (game.sets1 !== null ? game.sets1 : '') : '',
      sets2: canEditCitadosAndSets ? (game.sets2 !== null ? game.sets2 : '') : '',
      // citados se maneja en selectedCitados/useEffect si admin
    });
    // citados para admin
    if (canEditCitadosAndSets && game.citados) {
      setSelectedCitados(
        game.citados
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
      );
    }
  };

  // Guardar cambios de configuración (equipos, fecha, hora)
  const handleSaveConfigGame = async (e) => {
    e.preventDefault();
    if (!form.team1 || !form.team2 || !form.date || !form.time) return;
    let body = {
      team1: form.team1,
      team2: form.team2,
      date: form.date,
      time: form.time,
      league: activeLeague
    };
    const res = await fetch(`${API_GAMES}/${editConfigGame._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      await fetchGames();
    }
    setEditConfigGame(null);
    setForm({ team1: '', team2: '', date: '', time: '' });
  };

  // Guardar cambios de marcador (marcador, sets, citados)
  const handleSaveScoreGame = async (e) => {
    e.preventDefault();
    let body = {};
    if (canEditMatchData) {
      body.score1 = form.score1;
      body.score2 = form.score2;
    }
    if (canEditCitadosAndSets) {
      body.sets1 = form.sets1;
      body.sets2 = form.sets2;
      body.citados = selectedCitados.join(', ');
    }
    const res = await fetch(`${API_GAMES}/${editScoreGame._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      await fetchGames();
    }
    setEditScoreGame(null);
    setForm({ score1: '', score2: '', sets1: '', sets2: '' });
    setSelectedCitados([]);
  };

  const handleAddOrEditGame = async (e) => {
    e.preventDefault();
    if (!form.team1 || !form.team2 || !form.date || !form.time) return;

    // Busca los objetos de los equipos seleccionados para obtener abbr
    const team1Obj = teams.find(t => t.name === form.team1);
    const team2Obj = teams.find(t => t.name === form.team2);

    let body = {
      team1: form.team1,
      team2: form.team2,
      team1_abbr: team1Obj?.abbr || form.team1, // Abreviación o nombre si no existe
      team2_abbr: team2Obj?.abbr || form.team2,
      date: form.date,
      time: form.time,
      league: activeLeague
    };
    // Solo admin puede enviar citados y sets
    if (canEditCitadosAndSets) {
      body.citados = selectedCitados.join(', ');
      body.sets1 = form.sets1;
      body.sets2 = form.sets2;
    }
    // Admin y match-manager pueden editar marcador
    if (canEditMatchData) {
      body.score1 = form.score1;
      body.score2 = form.score2;
    }
    let res;
    if (editingGame && editingGame !== 'new') {
      // Editar partido
      res = await fetch(`${API_GAMES}/${editingGame._id || editingGame}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } else {
      // Crear partido
      res = await fetch(API_GAMES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }
    if (res && res.ok) {
      await fetchGames();
    }
    setForm({ team1: '', team2: '', date: '', time: '' });
    setEditingGame(null);
    setSelectedCitados([]);
  };

  const handleEditGame = (game) => {
    setEditingGame(game);
    setForm({
      team1: game.team1,
      team2: game.team2,
      date: game.date,
      time: game.time,
      // Solo admin puede editar citados y sets
      score1: canEditMatchData ? (game.score1 !== null ? game.score1 : '') : '',
      score2: canEditMatchData ? (game.score2 !== null ? game.score2 : '') : '',
      sets1: canEditCitadosAndSets ? (game.sets1 !== null ? game.sets1 : '') : '',
      sets2: canEditCitadosAndSets ? (game.sets2 !== null ? game.sets2 : '') : '',
      // citados ya no se usa aquí
    });
    // citados se carga en useEffect
  };

  const handleDeleteGame = (gameId) => {
    const game = games.find(g => g._id === gameId);
    setGameToDelete({ 
      id: gameId, 
      name: game ? `${game.team1?.name || 'Equipo 1'} vs ${game.team2?.name || 'Equipo 2'}` : 'Partido'
    });
    setShowConfirmModal(true);
  };

  const confirmDeleteGame = async () => {
    if (gameToDelete) {
      const res = await fetch(`${API_GAMES}/${gameToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchGames();
      }
      setEditingGame(null);
      setForm({ team1: '', team2: '', date: '', time: '' });
    }
    setShowConfirmModal(false);
    setGameToDelete(null);
  };

  const handleCancelEdit = () => {
    setEditingGame(null);
    setForm({ team1: '', team2: '', date: '', time: '' });
  };

  // NUEVO: Modal para ver partido (solo para admin/editor)
  const handleShowGame = (game) => {
    setSelectedGame(game);
  };
  // eslint-disable-next-line no-unused-vars
  const handleCloseGameModal = () => {
    setSelectedGame(null);
  };

  // Bloquear scroll cuando el modal está abierto (igual que TeamsPage)
  useEffect(() => {
    if (selectedGame || editingGame !== null) {
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [selectedGame, editingGame]);

  // NUEVO: Socket.IO
  const [socket, setSocket] = useState(null);

  // Inicializa socket siempre (no solo para admin/editor)
  useEffect(() => {
    const s = socketIOClient(SOCKET_URL, { transports: ['websocket'] });
    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, []);

  // Escucha eventos de marcador y sets en vivo para TODOS los usuarios (incluida la vista pública)
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
      setLiveScoreGame(prev =>
        prev && prev._id === gameId
          ? { ...prev, score1, score2, ...(typeof partidoFinalizado === 'boolean' ? { partidoFinalizado } : {}) }
          : prev
      );
      setPublicGameModal(prev =>
        prev && prev._id === gameId
          ? { ...prev, score1, score2, ...(typeof partidoFinalizado === 'boolean' ? { partidoFinalizado } : {}) }
          : prev
      );
    };

    // Actualiza marcador de set actual (opcional, si quieres mostrar el set actual en público)
    const handleSetScoreUpdate = ({ gameId, setScore }) => {
      setGames(prevGames =>
        prevGames.map(g =>
          g._id === gameId
            ? { ...g, score1: setScore.score1, score2: setScore.score2 }
            : g
        )
      );
      setLiveScoreGame(prev =>
        prev && prev._id === gameId
          ? { ...prev, score1: setScore.score1, score2: setScore.score2 }
          : prev
      );
      setCurrentSetScore(prev =>
        liveScoreGame && liveScoreGame._id === gameId ? setScore : prev
      );
      // NUEVO: Actualiza el marcador en el modal público si está abierto y corresponde a este partido
      setPublicGameModal(prev =>
        prev && prev._id === gameId
          ? { ...prev, score1: setScore.score1, score2: setScore.score2 }
          : prev
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
      setLiveScoreGame(prev =>
        prev && prev._id === gameId
          ? { ...prev, setsHistory, sets1, sets2, score1, score2, partidoFinalizado }
          : prev
      );
      setPublicGameModal(prev =>
        prev && prev._id === gameId
          ? { ...prev, setsHistory, sets1, sets2, score1, score2, partidoFinalizado }
          : prev
      );
    };

    // Nuevo: Eliminar partido en tiempo real al recibir el evento game_deleted
    const handleGameDeleted = ({ _id }) => {
      setGames(prevGames => prevGames.filter(g => g._id !== _id));
      setLiveScoreGame(prev => (prev && prev._id === _id ? null : prev));
      setPublicGameModal(prev => (prev && prev._id === _id ? null : prev));
      setEditingGame(prev => (prev && prev._id === _id ? null : prev));
      setGameToDelete(prev => (prev && prev.id === _id ? null : prev));
    };

    // Nuevo: Actualizar partidos en tiempo real cuando se confirmen citados o se cree/actualice un partido
    const handleGameCreatedOrUpdated = () => {
      fetchGames();
    };

    socket.on('score_update', handleScoreUpdate);
    socket.on('set_score_update', handleSetScoreUpdate);
    socket.on('sets_history_update', handleSetsHistoryUpdate);
    socket.on('game_deleted', handleGameDeleted);
    socket.on('game_created', handleGameCreatedOrUpdated);
    socket.on('game_updated', handleGameCreatedOrUpdated);

    return () => {
      socket.off('score_update', handleScoreUpdate);
      socket.off('set_score_update', handleSetScoreUpdate);
      socket.off('sets_history_update', handleSetsHistoryUpdate);
      socket.off('game_deleted', handleGameDeleted);
      socket.off('game_created', handleGameCreatedOrUpdated);
      socket.off('game_updated', handleGameCreatedOrUpdated);
    };
  }, [socket, liveScoreGame, fetchGames]);
  
  // NUEVO: Sincronizar currentSetScore y liveSets por socket.io
  useEffect(() => {
    if (!socket) return;

    // Escuchar cambios de marcador de set actual
    const handleSetScoreUpdate = ({ gameId, setScore }) => {
      setLiveScoreGame(prev =>
        prev && prev._id === gameId ? { ...prev } : prev
      );
      setCurrentSetScore(prev =>
        liveScoreGame && liveScoreGame._id === gameId ? setScore : prev
      );
    };

    // Escuchar historial de sets actualizado
    const handleSetsHistoryUpdate = ({ gameId, setsHistory, sets1, sets2, score1, score2, partidoFinalizado }) => {
      setLiveSets(prev =>
        liveScoreGame && liveScoreGame._id === gameId ? setsHistory : prev
      );
      setCurrentSetScore({ score1: 0, score2: 0 });
      setLiveScoreGame(prev =>
        prev && prev._id === gameId
          ? { ...prev, setsHistory, sets1, sets2, score1, score2, partidoFinalizado }
          : prev
      );
      setGames(prevGames =>
        prevGames.map(g =>
          g._id === gameId
            ? { ...g, setsHistory, sets1, sets2, score1, score2, partidoFinalizado }
            : g
        )
      );
    };

    socket.on('set_score_update', handleSetScoreUpdate);
    socket.on('sets_history_update', handleSetsHistoryUpdate);

    return () => {
      socket.off('set_score_update', handleSetScoreUpdate);
      socket.off('sets_history_update', handleSetsHistoryUpdate);
    };
  }, [socket, liveScoreGame, setGames]);

  // NUEVO: Función para actualizar el marcador en el backend y emitir por socket.io
  const updateScore = useCallback((gameId, score1, score2) => {
    // Actualiza el estado local inmediatamente para feedback instantáneo
    setGames(prevGames =>
      prevGames.map(g =>
        g._id === gameId ? { ...g, score1, score2 } : g
      )
    );
    setLiveScoreGame(prev =>
      prev && prev._id === gameId ? { ...prev, score1, score2 } : prev
    );
    // Llama al backend (el backend emitirá a todos por socket.io)
    fetch(`${API_GAMES}/${gameId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score1, score2 }),
    });
    // Emite por socket.io para feedback instantáneo a otros clientes
    if (socket) {
      socket.emit('score_update', { gameId, score1, score2 });
    }
  }, [socket, setGames, setLiveScoreGame]);

  // NUEVO: Escucha eventos de score_update de otros clientes
  useEffect(() => {
    if (!socket) return;
    const handler = ({ gameId, score1, score2 }) => {
      setGames(prevGames =>
        prevGames.map(g =>
          g._id === gameId ? { ...g, score1, score2 } : g
        )
      );
      setLiveScoreGame(prev =>
        prev && prev._id === gameId ? { ...prev, score1, score2 } : prev
      );
    };
    socket.on('score_update', handler);
    return () => {
      socket.off('score_update', handler);
    };
  }, [socket]);

  // NUEVO: Handlers para botones +1/-1 (asegúrate de que esté antes del render)
  // eslint-disable-next-line no-unused-vars
  const handleScoreChange = (team, delta) => {
    if (!liveScoreGame) return;
    const newScore1 = team === 1 ? Math.max(0, (liveScoreGame.score1 || 0) + delta) : liveScoreGame.score1;
    const newScore2 = team === 2 ? Math.max(0, (liveScoreGame.score2 || 0) + delta) : liveScoreGame.score2;
    updateScore(liveScoreGame._id, newScore1, newScore2);
  };

  // --- Lógica de voley para finalizar set y partido ---
  function canFinishSet(score1, score2, setIndex, leagueConfig) {
    // setsToWin: 3 = mejor de 5 (gana 3 sets), 2 = mejor de 3 (gana 2 sets)
    const totalSets = leagueConfig.setsToWin * 2 - 1;
    const isLastSet = setIndex === (totalSets - 1);
    const pointsToWin = isLastSet ? leagueConfig.lastSetPoints : 25;
    // Un equipo debe llegar a pointsToWin y tener diferencia de 2
    if (
      (score1 >= pointsToWin || score2 >= pointsToWin) &&
      Math.abs(score1 - score2) >= 2 &&
      score1 !== score2
    ) {
      return true;
    }
    return false;
  }

  // Sumar/restar puntos del set actual y emitir por socket
  // eslint-disable-next-line no-unused-vars
  const handleSetScoreChange = (team, delta) => {
    setCurrentSetScore(prev => {
      let s1 = prev.score1, s2 = prev.score2;
      if (team === 1) s1 = Math.max(0, s1 + delta);
      if (team === 2) s2 = Math.max(0, s2 + delta);
      const newScore = { score1: s1, score2: s2 };
      // Emitir por socket para sincronizar con otros clientes
      if (socket && liveScoreGame) {
        socket.emit('set_score_update', {
          gameId: liveScoreGame._id,
          setScore: newScore
        });
      }
      // Actualiza el score1 y score2 del partido en la lista de games
      if (liveScoreGame) {
        setGames(prevGames =>
          prevGames.map(g =>
            g._id === liveScoreGame._id
              ? { ...g, score1: newScore.score1, score2: newScore.score2 }
              : g
          )
        );
        setLiveScoreGame(prev =>
          prev && prev._id === liveScoreGame._id
            ? { ...prev, score1: newScore.score1, score2: newScore.score2 }
            : prev
        );
        // --- GUARDAR EL MARCADOR ACTUAL DEL SET EN EL BACKEND ---
        fetch(`${API_GAMES}/${liveScoreGame._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            score1: newScore.score1,
            score2: newScore.score2
          }),
        });
      }
      setPublicGameModal(prev =>
        prev && prev._id === liveScoreGame?._id
          ? { ...prev, score1: newScore.score1, score2: newScore.score2 }
          : prev
      );
      return newScore;
    });
  };

  // Finalizar set manualmente y emitir historial por socket
  // eslint-disable-next-line no-unused-vars
  const handleFinishSet = async () => {
    const setIndex = liveSets.length;
    const { score1, score2 } = currentSetScore;
    if (!canFinishSet(score1, score2, setIndex, leagueConfig)) {
      alert(language === 'en'
        ? 'Set cannot be finished. Check points and difference.'
        : 'No se puede finalizar el set. Revisa los puntos y la diferencia.');
      return;
    }
    // Agrega el set al historial
    const newSets = [...liveSets, { score1, score2 }];
    // Calcula sets ganados
    let sets1 = 0, sets2 = 0;
    newSets.forEach(s => {
      if (s.score1 > s.score2) sets1++;
      else if (s.score2 > s.score1) sets2++;
    });

    // ¿Ya hay ganador del partido?
    let partidoFinalizado = false;
    if (sets1 === leagueConfig.setsToWin || sets2 === leagueConfig.setsToWin) {
      partidoFinalizado = true;
    }

    // Guarda en backend: setsHistory, sets1, sets2, score1, score2 (último set), partidoFinalizado
    await fetch(`${API_GAMES}/${liveScoreGame._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        setsHistory: newSets,
        sets1,
        sets2,
        score1,
        score2,
        partidoFinalizado
      }),
    });
    // Emitir por socket para sincronizar sets y estado del partido
    if (socket) {
      socket.emit('sets_history_update', {
        gameId: liveScoreGame._id,
        setsHistory: newSets,
        sets1,
        sets2,
        score1,
        score2,
        partidoFinalizado
      });
    }
    // Actualiza estado local
    setLiveSets(newSets);
    setCurrentSetScore({ score1: 0, score2: 0 });
    setLiveScoreGame(prev => ({
      ...prev,
      setsHistory: newSets,
      sets1,
      sets2,
      score1,
      score2,
      partidoFinalizado
    }));
    setGames(prevGames =>
      prevGames.map(g =>
        g._id === liveScoreGame._id
          ? { ...g, setsHistory: newSets, sets1, sets2, score1, score2, partidoFinalizado }
          : g
      )
    );
  };

  // --- Render ---
  // Mueve el useState fuera del render condicional para cumplir las reglas de hooks
  const [publicGameModal, setPublicGameModal] = useState(null);

  // NUEVO: Estado para marcador en vivo del set actual en el modal público
  const [liveSetScore, setLiveSetScore] = useState({ score1: 0, score2: 0 });

  // NUEVO: Escuchar marcador en vivo del set actual para el modal público
  useEffect(() => {
    if (!publicGameModal || !socket) return;

    // Inicializa con el score actual si el partido está en curso
    if (!publicGameModal.partidoFinalizado) {
      setLiveSetScore({
        score1: typeof publicGameModal.score1 === 'number' ? publicGameModal.score1 : 0,
        score2: typeof publicGameModal.score2 === 'number' ? publicGameModal.score2 : 0,
      });
    }

    const handleSetScoreUpdate = ({ gameId, setScore }) => {
      // Si el partido ya está finalizado, limpia el marcador en vivo
      if (publicGameModal.partidoFinalizado) {
        setLiveSetScore({ score1: 0, score2: 0 });
        return;
      }
      if (gameId === publicGameModal._id) {
        setLiveSetScore(setScore);
      }
    };

    // También escucha si el partido se finaliza por socket y limpia el marcador en vivo
    const handleSetsHistoryUpdate = ({ gameId, partidoFinalizado }) => {
      if (gameId === publicGameModal._id && partidoFinalizado) {
        setLiveSetScore({ score1: 0, score2: 0 });
      }
    };

    socket.on('set_score_update', handleSetScoreUpdate);
    socket.on('sets_history_update', handleSetsHistoryUpdate);

    // Si el partido ya está finalizado (por actualización de estado), limpia el marcador en vivo
    if (publicGameModal.partidoFinalizado) {
      setLiveSetScore({ score1: 0, score2: 0 });
    }

    return () => {
      socket.off('set_score_update', handleSetScoreUpdate);
      socket.off('sets_history_update', handleSetsHistoryUpdate);
    };
  }, [publicGameModal, socket]);

  // Añade los estados para el modal de citados ANTES de cualquier uso
  const [pendingCitadosGame, setPendingCitadosGame] = useState(null);
  const [pendingCitados, setPendingCitados] = useState([]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (userRole === 'admin' || userRole === 'content-editor' || userRole === 'match-manager') {
    return (
      <div className="container" style={{ margin: 0 }}>
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
          <button className="btn btn-primary" onClick={() => {
            setEditingGame('new');
            setForm({
              team1: '',
              team2: '',
              date: '',
              time: '',
              citados: '',
              score1: '',
              score2: '',
              sets1: '',
              sets2: ''
            });
          }}>
            {language === 'en' ? 'Add Game' : 'Agregar Partido'}
          </button>
        </div>
        {/* Modal para agregar/editar partido */}
        {editingGame === 'new' && (
          <div className="modal-overlay" onClick={handleCancelEdit}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="btn btn-secondary close-button" onClick={handleCancelEdit}>&times;</button>
              <h2>{language === 'en' ? 'Add Game' : 'Agregar Partido'}</h2>
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
                    {language === 'en' ? 'Save' : 'Guardar'}
                  </button>
                  <button className="btn btn-secondary ms-2" type="button" onClick={handleCancelEdit}>
                    {language === 'en' ? 'Cancel' : 'Cancelar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        <div className="row justify-content-center">
          {!loading && games.length === 0 ? (
            <div className="col-12">
              <EmptyState
                icon="🏐"
                title={language === 'en' ? 'No Games Scheduled' : 'No Hay Partidos Programados'}
                description={
                  language === 'en' 
                    ? 'There are no games scheduled for the selected league. Check back later or select a different league.' 
                    : 'No hay partidos programados para la liga seleccionada. Vuelve más tarde o selecciona una liga diferente.'
                }
                language={language}
              />
            </div>
          ) : (
            games.map((game, idx) => {
            // Buscar los objetos de equipo para obtener el logo
            const team1Obj = teams.find(t => t.name === game.team1);
            const team2Obj = teams.find(t => t.name === game.team2);
            const team1Logo = team1Obj?.logo;
            const team2Logo = team2Obj?.logo;
            return (
              <div
                key={game._id || idx}
                className="col-md-4 mb-3"
              >
                <div
                  className="card h-100"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    // Mostrar el resultado final en el modal público si el partido está finalizado
                    if (game.partidoFinalizado) {
                      setPublicGameModal({
                        ...game,
                        // Asegura que sets1 y sets2 estén actualizados
                        sets1: typeof game.sets1 === 'number' ? game.sets1 : (
                          Array.isArray(game.setsHistory)
                            ? game.setsHistory.filter(s => s.score1 > s.score2).length
                            : 0
                        ),
                        sets2: typeof game.sets2 === 'number' ? game.sets2 : (
                          Array.isArray(game.setsHistory)
                            ? game.setsHistory.filter(s => s.score2 > s.score1).length
                            : 0
                        ),
                        partidoFinalizado: true
                      });
                    } else if (canEditMatchData) {
                      // Mostrar primero el modal de citados si aún no están definidos
                      if (!game.citados || game.citados.trim() === '') {
                        setPendingCitadosGame(game);
                        setPendingCitados([]);
                      } else {
                        if (!game.partidoFinalizado) {
                          setLiveScoreGame(game);
                        }
                      }
                    } else {
                      handleShowGame(game);
                    }
                  }}
                >
                  <div className="card-body">
                    {/* Mostrar abreviaciones y logos debajo */}
                    <div className="game-team-names">
                      <span className="game-team-name left">{game.team1_abbr || game.team1}</span>
                      <span className="game-vs-text">{texts[language]?.vs || 'vs'}</span>
                      <span className="game-team-name right">{game.team2_abbr || game.team2}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        {team1Logo && (
                          <img
                            src={team1Logo}
                            alt={game.team1_abbr || game.team1}
                            style={{ maxHeight: 90, maxWidth: 120, marginRight: 4, objectFit: 'contain', display: 'inline-block' }}
                          />
                        )}
                      </div>
                      <div style={{ width: 48 }}></div>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        {team2Logo && (
                          <img
                            src={team2Logo}
                            alt={game.team2_abbr || game.team2}
                            style={{ maxHeight: 90, maxWidth: 120, marginLeft: 4, objectFit: 'contain', display: 'inline-block' }}
                          />
                        )}
                      </div>
                    </div>
                    <div className="mb-2">
                      <span>{game.date} - {game.time}</span>
                    </div>
                    {/* NUEVO: Mostrar sets si existen */}
                    {(game.sets1 !== undefined || game.sets2 !== undefined) && (
                      <div className="mt-2">
                        <span>Sets: {game.sets1 ?? '-'} - {game.sets2 ?? '-'}</span>
                      </div>
                    )}
                    {/* Si el partido está finalizado, muestra un aviso */}
                    {game.partidoFinalizado && (
                      <div style={{ color: '#007bff', fontWeight: 'bold', marginTop: 8 }}>
                        {language === 'en' ? 'Finished' : 'Finalizado'}
                      </div>
                    )}
                    <div className="mt-2">
                      {/* Solo admin y content-editor pueden editar configuración */}
                      {(userRole === 'admin' || userRole === 'content-editor') && (
                        <button
                          className="btn btn-outline-secondary btn-sm me-2"
                          onClick={e => { e.stopPropagation(); handleEditConfigGame(game); }}
                        >
                          {language === 'en' ? 'Edit' : 'Editar'}
                        </button>
                      )}
                      {/* Solo admin y content-editor pueden eliminar */}
                      {(userRole === 'admin' || userRole === 'content-editor') && (
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={e => { e.stopPropagation(); handleDeleteGame(game._id); }}
                        >
                          {language === 'en' ? 'Delete' : 'Eliminar'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
            })
          )}
        </div>
        {/* Modal para editar configuración */}
        {editConfigGame && (
          <div className="modal-overlay" onClick={() => setEditConfigGame(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="btn btn-secondary close-button" onClick={() => setEditConfigGame(null)}>&times;</button>
              <h2>{language === 'en' ? 'Edit Game' : 'Editar Partido'}</h2>
              <form className="row g-2 align-items-end" onSubmit={handleSaveConfigGame}>
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
                    {language === 'en' ? 'Save Changes' : 'Guardar Cambios'}
                  </button>
                  <button className="btn btn-secondary ms-2" type="button" onClick={() => setEditConfigGame(null)}>
                    {language === 'en' ? 'Cancel' : 'Cancelar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Modal para editar marcador */}
        {editScoreGame && (
          <div className="modal-overlay" onClick={() => setEditScoreGame(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="btn btn-secondary close-button" onClick={() => setEditScoreGame(null)}>&times;</button>
              <h2>{language === 'en' ? 'Edit Score' : 'Editar Marcador'}</h2>
              <form className="row g-2 align-items-end" onSubmit={handleSaveScoreGame}>
                {canEditMatchData && (
                  <>
                    <div className="col-6 mb-2">
                      <label className="form-label">{language === 'en' ? 'Score Team 1' : 'Puntos Equipo 1'}</label>
                      <input
                        type="number"
                        className="form-control"
                        name="score1"
                        value={form.score1}
                        onChange={handleFormChange}
                        min="0"
                      />
                    </div>
                    <div className="col-6 mb-2">
                      <label className="form-label">{language === 'en' ? 'Score Team 2' : 'Puntos Equipo 2'}</label>
                      <input
                        type="number"
                        className="form-control"
                        name="score2"
                        value={form.score2}
                        onChange={handleFormChange}
                        min="0"
                      />
                    </div>
                  </>
                )}
                {canEditCitadosAndSets && (
                  <>
                    <div className="col-6 mb-2">
                      <label className="form-label">{language === 'en' ? 'Sets Team 1' : 'Sets Equipo 1'}</label>
                      <input
                        type="number"
                        className="form-control"
                        name="sets1"
                        value={form.sets1}
                        onChange={handleFormChange}
                        min="0"
                        max="5"
                      />
                    </div>
                    <div className="col-6 mb-2">
                      <label className="form-label">{language === 'en' ? 'Sets Team 2' : 'Sets Equipo 2'}</label>
                      <input
                        type="number"
                        className="form-control"
                        name="sets2"
                        value={form.sets2}
                        onChange={handleFormChange}
                        min="0"
                        max="5"
                      />
                    </div>
                    <div className="col-12 mb-2">
                      <label className="form-label">{language === 'en' ? 'Called Players' : 'Citados'}</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {[...roster1, ...roster2].map(player => {
                          const playerName = typeof player === 'string' ? player : player.name;
                          return (
                            <label key={playerName} style={{ marginRight: 12 }}>
                              <input
                                type="checkbox"
                                checked={selectedCitados.includes(playerName)}
                                onChange={() => handleCitadoToggle(playerName)}
                              />{' '}
                              {playerName}
                            </label>
                          );
                        })}
                        {roster1.length === 0 && roster2.length === 0 && (
                          <span style={{ color: '#888' }}>
                            {language === 'en'
                              ? 'Select teams to see roster'
                              : 'Selecciona equipos para ver la plantilla'}
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )}
                <div className="col-12 mt-3">
                  <button className="btn btn-success" type="submit">
                    {language === 'en' ? 'Save Changes' : 'Guardar Cambios'}
                  </button>
                  <button className="btn btn-secondary ms-2" type="button" onClick={() => setEditScoreGame(null)}>
                    {language === 'en' ? 'Cancel' : 'Cancelar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Modal de confirmación para eliminar partido */}
        <ConfirmModal
          show={showConfirmModal}
          onHide={() => {
            setShowConfirmModal(false);
            setGameToDelete(null);
          }}
          onConfirm={confirmDeleteGame}
          title={language === 'en' ? 'Delete Game' : 'Eliminar Partido'}
          message={
            gameToDelete 
              ? (language === 'en' 
                  ? `Are you sure you want to delete the game "${gameToDelete.name}"?`
                  : `¿Seguro que deseas eliminar el partido "${gameToDelete.name}"?`)
              : ''
          }
          confirmText={language === 'en' ? 'Delete' : 'Eliminar'}
          cancelText={language === 'en' ? 'Cancel' : 'Cancelar'}
          confirmVariant="danger"
        />
        {/* Modal para seleccionar citados antes de mostrar el marcador */}
        {pendingCitadosGame && (
          <div className="modal-overlay" onClick={() => setPendingCitadosGame(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
              <button
                className="btn btn-secondary close-button"
                onClick={() => setPendingCitadosGame(null)}
              >
                &times;
              </button>
              <h4 style={{ textAlign: 'center', marginBottom: 10 }}>
                {language === 'en' ? 'Select Called Players' : 'Selecciona los citados'}
              </h4>
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 32,
                marginBottom: 16
              }}>
                {/* Lado izquierdo: roster del equipo 1 */}
                <div style={{ minWidth: 120 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: 6, textAlign: 'left' }}>{pendingCitadosGame.team1}</div>
                  {(
                    Array.isArray(teams.find(t => t.name === pendingCitadosGame.team1)?.roster)
                      ? teams.find(t => t.name === pendingCitadosGame.team1).roster
                      : []
                  ).map(player => {
                    const playerName = typeof player === 'string' ? player : player.name;
                    return (
                      <label key={playerName} style={{ display: 'block', marginBottom: 4, textAlign: 'left' }}>
                        <input
                          type="checkbox"
                          checked={pendingCitados.includes(playerName)}
                          onChange={() => {
                            setPendingCitados(prev =>
                              prev.includes(playerName)
                                ? prev.filter(p => p !== playerName)
                                : [...prev, playerName]
                            );
                          }}
                        />{' '}
                        {playerName}
                      </label>
                    );
                  })}
                </div>
                {/* Lado derecho: roster del equipo 2 */}
                <div style={{ minWidth: 120 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: 6, textAlign: 'right' }}>{pendingCitadosGame.team2}</div>
                  {(
                    Array.isArray(teams.find(t => t.name === pendingCitadosGame.team2)?.roster)
                      ? teams.find(t => t.name === pendingCitadosGame.team2).roster
                      : []
                  ).map(player => {
                    const playerName = typeof player === 'string' ? player : player.name;
                    return (
                      <label key={playerName} style={{ display: 'block', marginBottom: 4, textAlign: 'right' }}>
                        <input
                          type="checkbox"
                          checked={pendingCitados.includes(playerName)}
                          onChange={() => {
                            setPendingCitados(prev =>
                              prev.includes(playerName)
                                ? prev.filter(p => p !== playerName)
                                : [...prev, playerName]
                            );
                          }}
                        />{' '}
                        {playerName}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <button
                  className="btn btn-success"
                  onClick={async () => {
                    // Guarda los citados en el backend y luego muestra el marcador
                    await fetch(`${API_GAMES}/${pendingCitadosGame._id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ citados: pendingCitados.join(', ') }),
                    });
                    // Actualiza el estado local de games
                    setGames(prevGames =>
                      prevGames.map(g =>
                        g._id === pendingCitadosGame._id
                          ? { ...g, citados: pendingCitados.join(', ') }
                          : g
                      )
                    );
                    setLiveScoreGame({ ...pendingCitadosGame, citados: pendingCitados.join(', ') });
                    setPendingCitadosGame(null);
                  }}
                  disabled={pendingCitados.length === 0}
                >
                  {language === 'en' ? 'Confirm Called Players' : 'Confirmar Citados'}
                </button>
                <div style={{ fontSize: 13, color: '#888', marginTop: 8 }}>
                  {language === 'en'
                    ? 'Select all players who will participate in this match.'
                    : 'Selecciona todos los jugadores que disputarán el encuentro.'}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Modal para editar marcador en vivo SOLO si el partido NO está finalizado */}
        {liveScoreGame && !liveScoreGame.partidoFinalizado && (
          <LiveScoreModal
            game={liveScoreGame}
            leagueConfig={leagueConfig}
            socket={socket}
            games={games}
            setGames={setGames}
            setLiveScoreGame={setLiveScoreGame}
            setPublicGameModal={setPublicGameModal}
            language={language}
          />
        )}
        {/* Antes del partido: crear/editar partidos */}
        <BeforeMatch
          leagues={leagues}
          activeLeague={activeLeague}
          setActiveLeague={setActiveLeague}
          teams={teams}
          games={games}
          setGames={setGames}
          form={form}
          setForm={setForm}
          editingGame={editingGame}
          setEditingGame={setEditingGame}
          handleFormChange={handleFormChange}
          handleAddOrEditGame={handleAddOrEditGame}
          handleEditGame={handleEditGame}
          handleDeleteGame={handleDeleteGame}
          handleCancelEdit={handleCancelEdit}
          language={language}
          texts={texts}
          selectedCitados={selectedCitados}
          setSelectedCitados={setSelectedCitados}
          handleCitadoToggle={handleCitadoToggle}
          canEditMatchData={canEditMatchData}
          canEditCitadosAndSets={canEditCitadosAndSets}
          roster1={roster1}
          roster2={roster2}
        />
        {/* Durante el partido: marcador en vivo */}
        <DuringMatch
          liveScoreGame={liveScoreGame}
          setLiveScoreGame={setLiveScoreGame}
          leagueConfig={leagueConfig}
          socket={socket}
          games={games}
          setGames={setGames}
          setPublicGameModal={setPublicGameModal}
          language={language}
        />
        {/* Después del partido: resultado final */}
        <AfterMatch
          publicGameModal={publicGameModal}
          setPublicGameModal={setPublicGameModal}
          language={language}
          texts={texts}
        />
      </div>
    );
  }

  // --- Vista pública (público general) ---
  // Elimina el marcador de la caja de partido, solo muestra si el partido está en curso o finalizado
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
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            <img 
              src={require('../assets/images/calendario.png')} 
              alt="Calendario" 
              style={{ width: 36, height: 36, objectFit: 'contain' }}
            />
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
          filteredGames.map((game, index) => {
            // Obtener abbr y logo de cada equipo
            const team1Obj = teams.find(t => t.name === game.team1);
            const team2Obj = teams.find(t => t.name === game.team2);
            const team1Abbr = game.team1_abbr || team1Obj?.abbr || game.team1;
            const team2Abbr = game.team2_abbr || team2Obj?.abbr || game.team2;
            const team1Logo = team1Obj?.logo;
            const team2Logo = team2Obj?.logo;
            let matchStatus = '';
            if (game.partidoFinalizado) {
              matchStatus = language === 'en' ? 'Finished' : 'Finalizado';
            } else if (!game.citados || game.citados.trim() === '') {
              matchStatus = language === 'en' ? 'Not started' : 'Pendiente';
            } else {
              matchStatus = language === 'en' ? 'In progress' : 'En curso';
            }
            return (
              <div
                key={game._id || index}
                className="game-box"
                onClick={() => setPublicGameModal(game)}
                style={{ cursor: 'pointer' }}
              >
                {/* Abreviaciones */}
                <div
                  className="team-names-public"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                    width: '100%'
                  }}
                >
                  <div
                    className="team-name-public"
                    style={{
                      textAlign: 'center',
                      flex: '1 1 0%',
                      fontWeight: 'bold',
                      fontSize: 18,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {team1Abbr}
                  </div>
                  <div
                    className="vs-text-public"
                    style={{
                      margin: '0 10px',
                      fontWeight: 'bold',
                      fontSize: 16,
                      color: '#555'
                    }}
                  >
                    {texts[language]?.vs || (language === 'en' ? 'vs' : 'vs')}
                  </div>
                  <div
                    className="team-name-public"
                    style={{
                      textAlign: 'center',
                      flex: '1 1 0%',
                      fontWeight: 'bold',
                      fontSize: 18,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {team2Abbr}
                  </div>
                </div>
                {/* Logos alineados igual que los nombres */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    marginBottom: 8,
                    width: '100%'
                  }}
                >
                  <div style={{ flex: '1 1 0%', textAlign: 'center', minWidth: 0 }}>
                    {team1Logo && (
                      <img src={team1Logo} alt={team1Abbr} style={{ maxHeight: 56, maxWidth: 72, objectFit: 'contain', display: 'inline-block' }} />
                    )}
                  </div>
                  <div style={{ width: 32, minWidth: 32 }}></div>
                  <div style={{ flex: '1 1 0%', textAlign: 'center', minWidth: 0 }}>
                    {team2Logo && (
                      <img src={team2Logo} alt={team2Abbr} style={{ maxHeight: 56, maxWidth: 72, objectFit: 'contain', display: 'inline-block' }} />
                    )}
                  </div>
                </div>
                {/* SOLO HORARIO, NO FECHA */}
                <div className="date-time">
                  {game.time}
                </div>
                {/* Estado del partido: Pendiente, En curso o Finalizado */}
                <div style={{
                  marginTop: 10,
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: game.partidoFinalizado
                    ? '#007bff'
                    : (!game.citados || game.citados.trim() === '')
                      ? '#888'
                      : '#28a745'
                }}>
                  {matchStatus}
                </div>
              </div>
            );
          })
        ) : (
          <p>{language === 'en' ? 'No games scheduled for this date.' : 'No hay partidos programados para esta fecha.'}</p>
        )}
      </div>
      {/* Modal detalle de sets y marcador en vivo para público */}
      {publicGameModal && (
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
                {(() => {
                  const team1Obj = teams.find(t => t.abbr === publicGameModal.team1_abbr || t.name === publicGameModal.team1);
                  return team1Obj?.name || publicGameModal.team1;
                })()}
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
                {texts[language]?.vs || 'vs'}
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
                {(() => {
                  const team2Obj = teams.find(t => t.abbr === publicGameModal.team2_abbr || t.name === publicGameModal.team2);
                  return team2Obj?.name || publicGameModal.team2;
                })()}
              </div>
            </div>
            {/* Logos de los equipos debajo del nombre - MÁS GRANDES */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
              width: '100%'
            }}>
              <div style={{ flex: '1 1 0%', textAlign: 'center', minWidth: 0 }}>
                {(() => {
                  const team1Obj = teams.find(t => t.abbr === publicGameModal.team1_abbr || t.name === publicGameModal.team1);
                  return team1Obj?.logo ? (
                    <img
                      src={team1Obj.logo}
                      alt={team1Obj.name}
                      style={{ maxHeight: 130, maxWidth: 140, objectFit: 'contain', display: 'inline-block' }}
                    />
                  ) : null;
                })()}
              </div>
              <div style={{ width: 48, minWidth: 48 }}></div>
              <div style={{ flex: '1 1 0%', textAlign: 'center', minWidth: 0 }}>
                {(() => {
                  const team2Obj = teams.find(t => t.abbr === publicGameModal.team2_abbr || t.name === publicGameModal.team2);
                  return team2Obj?.logo ? (
                    <img
                      src={team2Obj.logo}
                      alt={team2Obj.name}
                      style={{ maxHeight: 130, maxWidth: 140, objectFit: 'contain', display: 'inline-block' }}
                    />
                  ) : null;
                })()}
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
                      {language === 'en' ? 'Live' : 'En vivo'}
                    </th>
                  )}
                  <th style={{ padding: 6, border: '1px solid #ddd' }}>{language === 'en' ? 'Sets' : 'Sets'}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: 6, border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'right' }}>{publicGameModal.team1}</td>
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
                    {publicGameModal.sets1 ?? '-'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: 6, border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'right' }}>{publicGameModal.team2}</td>
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
                    {publicGameModal.sets2 ?? '-'}
                  </td>
                               </tr>
              </tbody>
            </table>
            <div style={{ fontSize: 15, color: '#888', marginTop: 10 }}>
              {publicGameModal.date} {publicGameModal.time}
            </div>
            <div style={{ marginTop: 12, textAlign: 'center', fontWeight: 'bold', fontSize: 18,
              color: publicGameModal.partidoFinalizado
                ? '#007bff'
                : (!publicGameModal.citados || publicGameModal.citados.trim() === '')
                  ? '#888'
                  : '#28a745'
            }}>
              {publicGameModal.partidoFinalizado
                ? (language === 'en' ? 'Finished' : 'Finalizado')
                : (!publicGameModal.citados || publicGameModal.citados.trim() === '')
                  ? (language === 'en' ? 'Not started' : 'Pendiente')
                  : (language === 'en' ? 'Live' : 'En vivo')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamesPage;
