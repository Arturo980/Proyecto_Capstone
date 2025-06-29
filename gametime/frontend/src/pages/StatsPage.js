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
  const [activeStatCategory, setActiveStatCategory] = useState('scoring');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('all'); // 'all', 'team1', 'team2'
  const [selectedGame, setSelectedGame] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  
  // Estado para preservar los datos ingresados temporalmente por jugador
  const [tempPlayerStats, setTempPlayerStats] = useState({});

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
  const getCitadosList = useCallback((game) => {
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
  }, [teams]);

  // Función helper para resetear estadísticas
  // Funciones para manejar los datos temporales de estadísticas
  const getTempPlayerKey = useCallback((playerName, team) => `${playerName}-${team}`, []);
  
  const getTempPlayerStats = (playerName, team) => {
    const key = getTempPlayerKey(playerName, team);
    return tempPlayerStats[key] || {};
  };
  
  const updateTempPlayerStats = (playerName, team, statKey, value) => {
    const key = getTempPlayerKey(playerName, team);
    setTempPlayerStats(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [statKey]: value
      }
    }));
  };
  
  const clearTempPlayerStats = () => {
    setTempPlayerStats({});
  };

  // Abrir modal para agregar estadística en una categoría
  const openAddModal = (cat) => {
    setActiveStatCategory(cat);
    setShowAddModal(true);
    setSelectedGame(null);
    setSelectedPlayer(null);
    clearTempPlayerStats(); // Limpiar datos temporales al abrir modal
  };

  // Guardar estadísticas usando la nueva API de game-stats
  const handleSaveStats = async () => {
    if (!selectedGame) return;
    
    // Recopilar datos de los datos temporales y de los inputs en la tabla
    const playersStats = {};
    
    // Primero, obtener citados del juego seleccionado
    const citados = getCitadosList(selectedGame);
    const allGamePlayers = [...citados.team1, ...citados.team2];
    
    console.log('🔍 Procesando estadísticas para', allGamePlayers.length, 'jugadores');
    
    // Procesar cada jugador citado
    allGamePlayers.forEach(player => {
      const playerKey = player.name + '_' + player.team;
      const tempStats = getTempPlayerStats(player.name, player.team);
      const existingStats = gameStats.find(
        gs => gs.gameId === selectedGame._id && 
              gs.playerName === player.name && 
              gs.team === player.team
      );
      
      // Crear objeto de estadísticas para el jugador
      playersStats[playerKey] = {
        playerName: player.name,
        team: player.team,
        gameId: selectedGame._id,
        league: leagueId,
        setsPlayed: Number(tempStats.setsPlayed || existingStats?.setsPlayed || 1),
        // Campos básicos
        aces: Number(tempStats.aces || existingStats?.aces || 0),
        assists: Number(tempStats.assists || existingStats?.assists || 0),
        attacks: Number(tempStats.attacks || existingStats?.attacks || 0),
        blocks: Number(tempStats.blocks || existingStats?.blocks || 0),
        digs: Number(tempStats.digs || existingStats?.digs || 0),
        hittingErrors: Number(tempStats.hittingErrors || existingStats?.hittingErrors || 0),
        kills: Number(tempStats.kills || existingStats?.kills || 0),
        // Nuevos campos para Attack
        attackErrors: Number(tempStats.attackErrors || existingStats?.attackErrors || 0),
        attackTotal: Number(tempStats.attackTotal || existingStats?.attackTotal || 0),
        // Nuevos campos para Block
        blockErrors: Number(tempStats.blockErrors || existingStats?.blockErrors || 0),
        blockTouches: Number(tempStats.blockTouches || existingStats?.blockTouches || 0),
        blockTotal: Number(tempStats.blockTotal || existingStats?.blockTotal || 0),
        // Nuevos campos para Serve
        serveErrors: Number(tempStats.serveErrors || existingStats?.serveErrors || 0),
        serveAttempts: Number(tempStats.serveAttempts || existingStats?.serveAttempts || 0),
        serveTotal: Number(tempStats.serveTotal || existingStats?.serveTotal || 0),
        // Nuevos campos para Reception
        receptionSuccessful: Number(tempStats.receptionSuccessful || existingStats?.receptionSuccessful || 0),
        receptionErrors: Number(tempStats.receptionErrors || existingStats?.receptionErrors || 0),
        receptionAttempts: Number(tempStats.receptionAttempts || existingStats?.receptionAttempts || 0),
        receptionTotal: Number(tempStats.receptionTotal || existingStats?.receptionTotal || 0),
        // Nuevos campos para Dig
        digErrors: Number(tempStats.digErrors || existingStats?.digErrors || 0),
        digTotal: Number(tempStats.digTotal || existingStats?.digTotal || 0),
        // Nuevos campos para Set
        setErrors: Number(tempStats.setErrors || existingStats?.setErrors || 0),
        setAttempts: Number(tempStats.setAttempts || existingStats?.setAttempts || 0),
        setTotal: Number(tempStats.setTotal || existingStats?.setTotal || 0)
      };
      
      console.log(`📊 Estadísticas para ${player.name} (${player.team}):`, playersStats[playerKey]);
    });

    // Calcular puntos automáticamente para cada jugador (aces + kills + blocks)
    Object.values(playersStats).forEach(stats => {
      stats.points = (stats.aces || 0) + (stats.kills || 0) + (stats.blocks || 0);
      console.log(`🧮 Puntos calculados para ${stats.playerName}: ${stats.points} (${stats.aces} aces + ${stats.kills} kills + ${stats.blocks} blocks)`);
    });

    // Filtrar solo los jugadores que tienen al menos una estadística > 0
    const validStats = Object.values(playersStats).filter(stats => 
      stats.points > 0 || stats.kills > 0 || stats.blocks > 0 || 
      stats.aces > 0 || stats.hittingErrors > 0 || stats.assists > 0 || 
      stats.attacks > 0 || stats.digs > 0 || stats.attackErrors > 0 ||
      stats.blockErrors > 0 || stats.blockTouches > 0 || stats.serveErrors > 0 ||
      stats.serveAttempts > 0 || stats.receptionSuccessful > 0 || stats.receptionErrors > 0 ||
      stats.receptionAttempts > 0 || stats.digErrors > 0 || stats.setErrors > 0 ||
      stats.setAttempts > 0
    );

    console.log('✅ Estadísticas válidas a guardar:', validStats.length, 'de', Object.keys(playersStats).length, 'jugadores');

    if (validStats.length === 0) {
      alert(language === 'en' ? 'Please enter at least one statistic for any player.' : 'Por favor ingrese al menos una estadística para algún jugador.');
      return;
    }

    try {
      // Guardar estadísticas para cada jugador
      const savePromises = validStats.map(async (statsData) => {
        console.log(`💾 Guardando estadísticas para ${statsData.playerName}:`, statsData);
        
        // Verificar si ya existe una estadística para este jugador en este partido
        const existingStats = gameStats.find(
          gs => gs.gameId === selectedGame._id && 
                gs.playerName === statsData.playerName && 
                gs.team === statsData.team
        );

        if (existingStats) {
          console.log(`🔄 Actualizando estadísticas existentes para ${statsData.playerName}`);
          // Actualizar estadística existente
          const response = await fetch(`${API_BASE_URL}/api/game-stats/${existingStats._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(statsData)
          });
          
          if (!response.ok) {
            const error = await response.json();
            console.error('❌ Error al actualizar:', error);
            throw new Error(error.error || `Error al actualizar estadísticas de ${statsData.playerName}`);
          }
          
          const result = await response.json();
          console.log(`✅ Estadísticas actualizadas para ${statsData.playerName}:`, result);
        } else {
          console.log(`🆕 Creando nuevas estadísticas para ${statsData.playerName}`);
          // Crear nueva estadística
          const response = await fetch(`${API_BASE_URL}/api/game-stats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(statsData)
          });

          if (!response.ok) {
            const error = await response.json();
            console.error('❌ Error al crear:', error);
            throw new Error(error.error || `Error al guardar estadísticas de ${statsData.playerName}`);
          }
          
          const result = await response.json();
          console.log(`✅ Estadísticas creadas para ${statsData.playerName}:`, result);
        }
      });

      await Promise.all(savePromises);

      console.log('🔄 Recargando datos...');
      // Recargar datos
      await Promise.all([
        fetchPlayerAverages(),
        fetchGameStats()
      ]);
      
      // Limpiar datos temporales después del guardado exitoso
      clearTempPlayerStats();
      
      setShowAddModal(false);
      setSelectedGame(null);
      setSelectedPlayer(null);
      alert(language === 'en' ? 'Statistics saved successfully!' : '¡Estadísticas guardadas exitosamente!');
    } catch (error) {
      console.error('❌ Error general:', error);
      alert(error.message);
    }
  };

  // Efecto para inicializar datos temporales cuando se selecciona un juego
  useEffect(() => {
    if (selectedGame) {
      // Obtener jugadores citados del juego
      const citados = getCitadosList(selectedGame);
      const allGamePlayers = [...citados.team1, ...citados.team2];
      
      // Inicializar datos temporales con estadísticas existentes para cada jugador
      const initialTempStats = {};
      
      allGamePlayers.forEach(player => {
        const existingStats = gameStats.find(
          gs => gs.gameId === selectedGame._id && 
                gs.playerName === player.name && 
                gs.team === player.team
        );
        
        if (existingStats) {
          const key = getTempPlayerKey(player.name, player.team);
          initialTempStats[key] = {
            setsPlayed: String(existingStats.setsPlayed || ''),
            blocks: String(existingStats.blocks || ''),
            assists: String(existingStats.assists || ''),
            aces: String(existingStats.aces || ''),
            attacks: String(existingStats.attacks || ''),
            digs: String(existingStats.digs || ''),
            hittingErrors: String(existingStats.hittingErrors || ''),
            kills: String(existingStats.kills || ''),
            attackErrors: String(existingStats.attackErrors || ''),
            blockErrors: String(existingStats.blockErrors || ''),
            blockTouches: String(existingStats.blockTouches || ''),
            serveErrors: String(existingStats.serveErrors || ''),
            serveAttempts: String(existingStats.serveAttempts || ''),
            receptionSuccessful: String(existingStats.receptionSuccessful || ''),
            receptionErrors: String(existingStats.receptionErrors || ''),
            receptionAttempts: String(existingStats.receptionAttempts || ''),
            digErrors: String(existingStats.digErrors || ''),
            setErrors: String(existingStats.setErrors || ''),
            setAttempts: String(existingStats.setAttempts || '')
          };
        }
      });
      
      // Solo actualizar los datos temporales si hay datos existentes
      if (Object.keys(initialTempStats).length > 0) {
        setTempPlayerStats(initialTempStats);
      }
    }
  }, [selectedGame, gameStats, getCitadosList, getTempPlayerKey]);

  // Funciones para manejar la gestión de estadísticas
  const handleEditGameStats = (stat) => {
    setSelectedGame(games.find(g => g._id === stat.gameId));
    setSelectedPlayer({ name: stat.playerName, team: stat.team });
    
    // Cargar los datos existentes en tempPlayerStats
    const playerKey = `${stat.playerName}_${stat.team}`;
    setTempPlayerStats(prev => ({
      ...prev,
      [playerKey]: {
        setsPlayed: String(stat.setsPlayed || ''),
        // Campos básicos existentes
        blocks: String(stat.blocks || ''),
        assists: String(stat.assists || ''),
        aces: String(stat.aces || ''),
        attacks: String(stat.attacks || ''),
        digs: String(stat.digs || ''),
        hittingErrors: String(stat.hittingErrors || ''),
        kills: String(stat.kills || ''),
        points: String(stat.points || ''),
        // Nuevos campos para Attack
        attackErrors: String(stat.attackErrors || ''),
        attackTotal: String(stat.attackTotal || ''),
        // Nuevos campos para Block
        blockErrors: String(stat.blockErrors || ''),
        blockTouches: String(stat.blockTouches || ''),
        blockTotal: String(stat.blockTotal || ''),
        // Nuevos campos para Serve
        serveErrors: String(stat.serveErrors || ''),
        serveAttempts: String(stat.serveAttempts || ''),
        serveTotal: String(stat.serveTotal || ''),
        // Nuevos campos para Reception
        receptionSuccessful: String(stat.receptionSuccessful || ''),
        receptionErrors: String(stat.receptionErrors || ''),
        receptionAttempts: String(stat.receptionAttempts || ''),
        receptionTotal: String(stat.receptionTotal || ''),
        // Nuevos campos para Dig
        digErrors: String(stat.digErrors || ''),
        digTotal: String(stat.digTotal || ''),
        // Nuevos campos para Set
        setErrors: String(stat.setErrors || ''),
        setAttempts: String(stat.setAttempts || ''),
        setTotal: String(stat.setTotal || '')
      }
    }));
    
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

  // Obtener columnas según la categoría activa
  const getColumnsForCategory = (category) => {
    const baseColumns = [
      { key: 'number', label: language === 'en' ? 'No' : 'Nº' },
      { key: 'playerName', label: language === 'en' ? 'Player Name' : 'Nombre del Jugador' },
      { key: 'position', label: language === 'en' ? 'Position' : 'Posición' }
    ];

    switch (category) {
      case 'scoring':
        return [
          ...baseColumns,
          { key: 'points', label: language === 'en' ? 'Total ABS' : 'Total ABS' },
          { key: 'kills', label: language === 'en' ? 'Attack Points' : 'Puntos de Ataque' },
          { key: 'blocks', label: language === 'en' ? 'Block Points' : 'Puntos de Bloqueo' },
          { key: 'aces', label: language === 'en' ? 'Serve Points' : 'Puntos de Saque' },
          { key: 'hittingErrors', label: language === 'en' ? 'Errors' : 'Errores' },
          { key: 'efficiency', label: language === 'en' ? 'Efficiency %' : 'Eficiencia %' }
        ];
      case 'attack':
        return [
          ...baseColumns,
          { key: 'kills', label: language === 'en' ? 'Points' : 'Puntos' },
          { key: 'attackErrors', label: language === 'en' ? 'Errors' : 'Errores' },
          { key: 'attacks', label: language === 'en' ? 'Attempts' : 'Intentos' },
          { key: 'attackTotal', label: language === 'en' ? 'Total' : 'Total' },
          { key: 'attackEfficiency', label: language === 'en' ? 'Efficiency %' : 'Eficiencia %' }
        ];
      case 'block':
        return [
          ...baseColumns,
          { key: 'blocks', label: language === 'en' ? 'Points' : 'Puntos' },
          { key: 'blockErrors', label: language === 'en' ? 'Errors' : 'Errores' },
          { key: 'blockTouches', label: language === 'en' ? 'Touches' : 'Toques' },
          { key: 'blockTotal', label: language === 'en' ? 'Total' : 'Total' },
          { key: 'blockEfficiency', label: language === 'en' ? 'Efficiency %' : 'Eficiencia %' }
        ];
      case 'serve':
        return [
          ...baseColumns,
          { key: 'aces', label: language === 'en' ? 'Points' : 'Puntos' },
          { key: 'serveErrors', label: language === 'en' ? 'Errors' : 'Errores' },
          { key: 'serveAttempts', label: language === 'en' ? 'Attempts' : 'Intentos' },
          { key: 'serveTotal', label: language === 'en' ? 'Total' : 'Total' },
          { key: 'serveEfficiency', label: language === 'en' ? 'Efficiency %' : 'Eficiencia %' }
        ];
      case 'reception':
        return [
          ...baseColumns,
          { key: 'receptionSuccessful', label: language === 'en' ? 'Successful' : 'Exitosas' },
          { key: 'receptionErrors', label: language === 'en' ? 'Errors' : 'Errores' },
          { key: 'receptionAttempts', label: language === 'en' ? 'Attempts' : 'Intentos' },
          { key: 'receptionTotal', label: language === 'en' ? 'Total' : 'Total' },
          { key: 'receptionEfficiency', label: language === 'en' ? 'Efficiency %' : 'Eficiencia %' }
        ];
      case 'dig':
        return [
          ...baseColumns,
          { key: 'digs', label: language === 'en' ? 'Digs' : 'Defensas' },
          { key: 'digErrors', label: language === 'en' ? 'Errors' : 'Errores' },
          { key: 'digTotal', label: language === 'en' ? 'Total' : 'Total' },
          { key: 'digEfficiency', label: language === 'en' ? 'Efficiency %' : 'Eficiencia %' }
        ];
      case 'set':
        return [
          ...baseColumns,
          { key: 'assists', label: language === 'en' ? 'Points' : 'Puntos' },
          { key: 'setErrors', label: language === 'en' ? 'Errors' : 'Errores' },
          { key: 'setAttempts', label: language === 'en' ? 'Attempts' : 'Intentos' },
          { key: 'setTotal', label: language === 'en' ? 'Total' : 'Total' },
          { key: 'setEfficiency', label: language === 'en' ? 'Efficiency %' : 'Eficiencia %' }
        ];
      default: // 'scoring' por defecto
        return [
          ...baseColumns,
          { key: 'points', label: language === 'en' ? 'Total ABS' : 'Total ABS' },
          { key: 'kills', label: language === 'en' ? 'Attack Points' : 'Puntos de Ataque' },
          { key: 'blocks', label: language === 'en' ? 'Block Points' : 'Puntos de Bloqueo' },
          { key: 'aces', label: language === 'en' ? 'Serve Points' : 'Puntos de Saque' },
          { key: 'hittingErrors', label: language === 'en' ? 'Errors' : 'Errores' },
          { key: 'efficiency', label: language === 'en' ? 'Efficiency %' : 'Eficiencia %' }
        ];
    }
  };

  // Obtener el valor de input para una estadística específica
  const getInputValue = (existingStats, statKey, playerName, team) => {
    // Primero verificar si hay datos temporales para este jugador
    if (playerName && team) {
      const tempStats = getTempPlayerStats(playerName, team);
      if (tempStats[statKey] !== undefined) {
        return tempStats[statKey];
      }
    }
    
    // Si no hay datos temporales, usar los datos existentes
    if (!existingStats) return '';
    
    // Lista de todos los campos válidos
    const validFields = [
      'setsPlayed', 'points', 'kills', 'blocks', 'aces', 'hittingErrors', 
      'assists', 'attacks', 'digs', 'attackErrors', 'attackTotal',
      'blockErrors', 'blockTouches', 'blockTotal', 'serveErrors', 
      'serveAttempts', 'serveTotal', 'receptionSuccessful', 
      'receptionErrors', 'receptionAttempts', 'receptionTotal',
      'digErrors', 'digTotal', 'setErrors', 'setAttempts', 'setTotal'
    ];
    
    if (validFields.includes(statKey)) {
      return existingStats[statKey] || '';
    }
    
    return '';
  };

  // Obtener logo del equipo por nombre
  const getTeamLogo = (teamName) => {
    const team = teams.find(t => t.name === teamName);
    return team?.logo || null;
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
                clearTempPlayerStats(); // Limpiar datos temporales al cerrar
                setShowAddModal(false);
                setSelectedGame(null);
                setSelectedPlayer(null);
              }}
            >
              <div 
                className="stats-modal-content stats-modal-wide"
                onClick={e => e.stopPropagation()}
              >
                <div className="stats-modal-header">
                  <h4>
                    {language === 'en' ? 'Match Statistics by Player' : 'Estadísticas del Partido por Jugador'}
                  </h4>
                </div>

                {/* Body */}
                <div className="stats-modal-body">
                  {/* Paso 1: Seleccionar partido finalizado */}
                  {!selectedGame && (
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
                          setSelectedTeamFilter('all'); // Reset team filter
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
                  )}

                  {/* Tabla de estadísticas por jugador */}
                  {selectedGame && (
                    <div className="match-stats-container">
                      {/* Filtros por equipo */}
                      <div className="team-filter-section">
                        <div className="team-filter-buttons">
                          <button 
                            className={`team-filter-btn ${selectedTeamFilter === 'all' ? 'active' : ''}`}
                            onClick={() => setSelectedTeamFilter('all')}
                          >
                            <div className="team-filter-content">
                              <span className="team-filter-icon">🌍</span>
                              <span className="team-filter-name">{language === 'en' ? 'All Players' : 'Todos los Jugadores'}</span>
                            </div>
                          </button>
                          <button 
                            className={`team-filter-btn ${selectedTeamFilter === 'team1' ? 'active' : ''}`}
                            onClick={() => setSelectedTeamFilter('team1')}
                          >
                            <div className="team-filter-content">
                              {getTeamLogo(selectedGame.team1) ? (
                                <img 
                                  src={getTeamLogo(selectedGame.team1)} 
                                  alt={selectedGame.team1}
                                  className="team-filter-logo"
                                />
                              ) : (
                                <span className="team-filter-icon">🏐</span>
                              )}
                              <span className="team-filter-name">{selectedGame.team1}</span>
                            </div>
                          </button>
                          <button 
                            className={`team-filter-btn ${selectedTeamFilter === 'team2' ? 'active' : ''}`}
                            onClick={() => setSelectedTeamFilter('team2')}
                          >
                            <div className="team-filter-content">
                              {getTeamLogo(selectedGame.team2) ? (
                                <img 
                                  src={getTeamLogo(selectedGame.team2)} 
                                  alt={selectedGame.team2}
                                  className="team-filter-logo"
                                />
                              ) : (
                                <span className="team-filter-icon">🏐</span>
                              )}
                              <span className="team-filter-name">{selectedGame.team2}</span>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Filtros de categorías */}
                      <div className="stats-categories-filter">
                        <div className="category-tabs">
                          <button 
                            className={`category-tab ${activeStatCategory === 'scoring' ? 'active' : ''}`}
                            onClick={() => setActiveStatCategory('scoring')}
                          >
                            {language === 'en' ? 'SCORING' : 'PUNTAJE'}
                          </button>
                          <button 
                            className={`category-tab ${activeStatCategory === 'attack' ? 'active' : ''}`}
                            onClick={() => setActiveStatCategory('attack')}
                          >
                            {language === 'en' ? 'ATTACK' : 'ATAQUE'}
                          </button>
                          <button 
                            className={`category-tab ${activeStatCategory === 'block' ? 'active' : ''}`}
                            onClick={() => setActiveStatCategory('block')}
                          >
                            {language === 'en' ? 'BLOCK' : 'BLOQUEO'}
                          </button>
                          <button 
                            className={`category-tab ${activeStatCategory === 'serve' ? 'active' : ''}`}
                            onClick={() => setActiveStatCategory('serve')}
                          >
                            {language === 'en' ? 'SERVE' : 'SAQUE'}
                          </button>
                          <button 
                            className={`category-tab ${activeStatCategory === 'reception' ? 'active' : ''}`}
                            onClick={() => setActiveStatCategory('reception')}
                          >
                            {language === 'en' ? 'RECEPTION' : 'RECEPCIÓN'}
                          </button>
                          <button 
                            className={`category-tab ${activeStatCategory === 'dig' ? 'active' : ''}`}
                            onClick={() => setActiveStatCategory('dig')}
                          >
                            {language === 'en' ? 'DIG' : 'DEFENSA'}
                          </button>
                          <button 
                            className={`category-tab ${activeStatCategory === 'set' ? 'active' : ''}`}
                            onClick={() => setActiveStatCategory('set')}
                          >
                            {language === 'en' ? 'SET' : 'COLOCACIÓN'}
                          </button>
                        </div>
                        <div className="legend-info">
                          <span className="legend-icon">ⓘ</span>
                          <span className="legend-text">
                            {language === 'en' ? 'Legend' : 'Leyenda'}
                          </span>
                        </div>
                      </div>

                      {/* Tabla principal de estadísticas */}
                      <div className="match-stats-table-container">
                        {/* Indicador de scroll para móviles */}
                        <div className="mobile-scroll-hint">
                          <span>📱 {language === 'en' ? 'Swipe left/right to see all stats' : 'Desliza izq/der para ver todas las estadísticas'} 👈👉</span>
                        </div>
                        <table className="match-stats-table">
                          <thead>
                            <tr>
                              {getColumnsForCategory(activeStatCategory).map((column, index) => (
                                <th key={column.key} className={index === 0 ? "player-header" : "stat-header"}>
                                  <div className="header-content">
                                    {index === 0 && <span className="header-icon">👤</span>}
                                    <span>{column.label}</span>
                                  </div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const citados = getCitadosList(selectedGame);
                              let allPlayers = [];
                              
                              // Filtrar jugadores según el equipo seleccionado
                              if (selectedTeamFilter === 'all') {
                                allPlayers = [...citados.team1, ...citados.team2];
                              } else if (selectedTeamFilter === 'team1') {
                                allPlayers = citados.team1;
                              } else if (selectedTeamFilter === 'team2') {
                                allPlayers = citados.team2;
                              }
                              
                              const columns = getColumnsForCategory(activeStatCategory);
                              
                              return allPlayers.map((player, idx) => {
                                const existingStats = gameStats.find(
                                  gs => gs.gameId === selectedGame._id && 
                                        gs.playerName === player.name && 
                                        gs.team === player.team
                                );
                                
                                return (
                                  <tr key={player.name + player.team} className="player-stats-row">
                                    {columns.map((column, colIndex) => {
                                      if (column.key === 'number') {
                                        return (
                                          <td key={column.key} className="player-number">
                                            <span className="jersey-number">{player.number || idx + 1}</span>
                                          </td>
                                        );
                                      } else if (column.key === 'playerName') {
                                        return (
                                          <td key={column.key} className="player-name-cell">
                                            <span className="player-name-text">{player.name}</span>
                                          </td>
                                        );
                                      } else if (column.key === 'position') {
                                        return (
                                          <td key={column.key} className="position-cell">
                                            <span className="position-text">{player.position || 'OH'}</span>
                                          </td>
                                        );
                                      } else if (column.key === 'efficiency' || column.key.includes('Efficiency')) {
                                        return (
                                          <td key={column.key} className="efficiency-cell">
                                            <span className="efficiency-value">
                                              {existingStats ? 
                                                Math.round(((existingStats.kills || 0) + (existingStats.blocks || 0) + (existingStats.aces || 0) - (existingStats.hittingErrors || 0)) / Math.max(1, existingStats.points || 1) * 100) / 100 
                                                : '--'
                                              }
                                            </span>
                                          </td>
                                        );
                                      } else if (column.key === 'points') {
                                        // Campo calculado automáticamente (aces + kills + blocks)
                                        const tempStats = getTempPlayerStats(player.name, player.team);
                                        const currentPoints = 
                                          (Number(tempStats.aces) || Number(existingStats?.aces) || 0) + 
                                          (Number(tempStats.kills) || Number(existingStats?.kills) || 0) + 
                                          (Number(tempStats.blocks) || Number(existingStats?.blocks) || 0);
                                        
                                        return (
                                          <td key={column.key} className="stat-calculated-cell">
                                            <span 
                                              className="stat-calculated"
                                              id={`points-${player.name}-${player.team}`.replace(/\s+/g, '-')}
                                            >
                                              {currentPoints}
                                            </span>
                                          </td>
                                        );
                                      } else if (column.key.includes('Total')) {
                                        // Campos "Total" calculados automáticamente
                                        const baseKey = column.key.replace('Total', '');
                                        const tempStats = getTempPlayerStats(player.name, player.team);
                                        
                                        let currentTotal = 0;
                                        
                                        if (baseKey === 'dig') {
                                          // Caso especial: dig total = digs + digErrors (sin attempts)
                                          currentTotal = 
                                            (Number(tempStats.digs) || Number(existingStats?.digs) || 0) + 
                                            (Number(tempStats.digErrors) || Number(existingStats?.digErrors) || 0);
                                        } else {
                                          // Casos normales: points + errors + attempts
                                          const pointsKey = baseKey === 'attack' ? 'kills' : baseKey === 'block' ? 'blocks' : baseKey === 'serve' ? 'aces' : baseKey === 'set' ? 'assists' : baseKey;
                                          const errorsKey = `${baseKey}Errors`;
                                          const attemptsKey = baseKey === 'block' ? 'blockTouches' : `${baseKey}Attempts`;
                                          
                                          currentTotal = 
                                            (Number(tempStats[pointsKey]) || Number(existingStats?.[pointsKey]) || 0) + 
                                            (Number(tempStats[errorsKey]) || Number(existingStats?.[errorsKey]) || 0) + 
                                            (Number(tempStats[attemptsKey]) || Number(existingStats?.[attemptsKey]) || 0);
                                        }
                                        
                                        return (
                                          <td key={column.key} className="stat-calculated-cell">
                                            <span 
                                              className="stat-calculated"
                                              id={`${column.key}-${player.name}-${player.team}`.replace(/\s+/g, '-')}
                                            >
                                              {currentTotal}
                                            </span>
                                          </td>
                                        );
                                      } else {
                                        return (
                                          <td key={column.key} className="stat-input-cell">
                                            <input
                                              type="number"
                                              className="stat-input"
                                              value={getInputValue(existingStats, column.key, player.name, player.team)}
                                              placeholder="0"
                                              min="0"
                                              data-player={player.name}
                                              data-team={player.team}
                                              data-stat={column.key}
                                              onChange={(e) => {
                                                const value = e.target.value;
                                                // Guardar en datos temporales
                                                updateTempPlayerStats(player.name, player.team, column.key, value);
                                                
                                                // Forzar re-render para actualizar campos calculados
                                                // Los campos calculados ahora usan getTempPlayerStats() directamente
                                              }}
                                            />
                                          </td>
                                        );
                                      }
                                    })}
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="stats-modal-footer">
                  <button
                    className="btn btn-secondary stats-modal-button"
                    onClick={() => {
                      clearTempPlayerStats(); // Limpiar datos temporales al cancelar
                      setShowAddModal(false);
                      setSelectedGame(null);
                      setSelectedPlayer(null);
                    }}
                  >
                    {language === 'en' ? 'Cancel' : 'Cancelar'}
                  </button>
                  {selectedGame && (
                    <button
                      className="btn btn-success stats-modal-button"
                      onClick={handleSaveStats}
                    >
                      {language === 'en' ? 'Save Statistics' : 'Guardar Estadísticas'}
                    </button>
                  )}
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
