import React, { useEffect, useState, useCallback } from 'react';
import { API_BASE_URL } from '../assets/Configuration/config';
import texts from '../translations/texts';
import '../styles/StatsPage.css';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

// Nuevas categorías de estadísticas según los requerimientos
const STAT_CATEGORIES = [
  {
    key: 'scoring',
    labelEs: 'Anotadores',
    labelEn: 'Best Scorers',
    columns: [
      { key: 'rank', labelEs: 'Rank', labelEn: 'Rank' },
      { key: 'playerName', labelEs: 'Nombre del Jugador', labelEn: 'Player Name' },
      { key: 'team', labelEs: 'Equipo', labelEn: 'Team' },
      { key: 'points', labelEs: 'Puntos', labelEn: 'Points' },
      { key: 'kills', labelEs: 'Puntos de Ataque', labelEn: 'Attack Points' },
      { key: 'blocks', labelEs: 'Puntos de Bloqueo', labelEn: 'Block Points' },
      { key: 'aces', labelEs: 'Puntos de Saque', labelEn: 'Serve Points' }
    ]
  },
  {
    key: 'attack',
    labelEs: 'Atacantes',
    labelEn: 'Best Attackers',
    columns: [
      { key: 'rank', labelEs: 'Rank', labelEn: 'Rank' },
      { key: 'playerName', labelEs: 'Nombre del Jugador', labelEn: 'Player Name' },
      { key: 'team', labelEs: 'Equipo', labelEn: 'Team' },
      { key: 'kills', labelEs: 'Puntos', labelEn: 'Points' },
      { key: 'attackErrors', labelEs: 'Errores', labelEn: 'Errors' },
      { key: 'attacks', labelEs: 'Intentos', labelEn: 'Attempts' },
      { key: 'averagePerMatch', labelEs: 'Promedio por partido', labelEn: 'Average per match' },
      { key: 'successPercentage', labelEs: 'Éxito %', labelEn: 'Success %' },
      { key: 'total', labelEs: 'Total', labelEn: 'Total' }
    ]
  },
  {
    key: 'block',
    labelEs: 'Bloqueadores',
    labelEn: 'Best Blockers',
    columns: [
      { key: 'rank', labelEs: 'Rank', labelEn: 'Rank' },
      { key: 'playerName', labelEs: 'Nombre del Jugador', labelEn: 'Player Name' },
      { key: 'team', labelEs: 'Equipo', labelEn: 'Team' },
      { key: 'blocks', labelEs: 'Bloqueos', labelEn: 'Blocks' },
      { key: 'blockErrors', labelEs: 'Errores', labelEn: 'Errors' },
      { key: 'blockTouches', labelEs: 'Toques', labelEn: 'Touches' },
      { key: 'averagePerMatch', labelEs: 'Promedio por partido', labelEn: 'Average per match' },
      { key: 'efficiencyPercentage', labelEs: 'Eficiencia %', labelEn: 'Efficiency %' },
      { key: 'total', labelEs: 'Total', labelEn: 'Total' }
    ]
  },
  {
    key: 'serve',
    labelEs: 'Sacadores',
    labelEn: 'Best Servers',
    columns: [
      { key: 'rank', labelEs: 'Rank', labelEn: 'Rank' },
      { key: 'playerName', labelEs: 'Nombre del Jugador', labelEn: 'Player Name' },
      { key: 'team', labelEs: 'Equipo', labelEn: 'Team' },
      { key: 'aces', labelEs: 'Puntos', labelEn: 'Points' },
      { key: 'serveErrors', labelEs: 'Errores', labelEn: 'Errors' },
      { key: 'serveAttempts', labelEs: 'Intentos', labelEn: 'Attempts' },
      { key: 'averagePerMatch', labelEs: 'Promedio por partido', labelEn: 'Average per match' },
      { key: 'successPercentage', labelEs: 'Éxito %', labelEn: 'Success %' },
      { key: 'total', labelEs: 'Total', labelEn: 'Total' }
    ]
  },
  {
    key: 'set',
    labelEs: 'Colocadores',
    labelEn: 'Best Setters',
    columns: [
      { key: 'rank', labelEs: 'Rank', labelEn: 'Rank' },
      { key: 'playerName', labelEs: 'Nombre del Jugador', labelEn: 'Player Name' },
      { key: 'team', labelEs: 'Equipo', labelEn: 'Team' },
      { key: 'assists', labelEs: 'Exitosos', labelEn: 'Successful' },
      { key: 'setErrors', labelEs: 'Errores', labelEn: 'Errors' },
      { key: 'setAttempts', labelEs: 'Intentos', labelEn: 'Attempts' },
      { key: 'averagePerMatch', labelEs: 'Promedio por partido', labelEn: 'Average per match' },
      { key: 'successPercentage', labelEs: 'Éxito %', labelEn: 'Success %' },
      { key: 'total', labelEs: 'Total', labelEn: 'Total' }
    ]
  },
  {
    key: 'dig',
    labelEs: 'Defensores',
    labelEn: 'Best Diggers',
    columns: [
      { key: 'rank', labelEs: 'Rank', labelEn: 'Rank' },
      { key: 'playerName', labelEs: 'Nombre del Jugador', labelEn: 'Player Name' },
      { key: 'team', labelEs: 'Equipo', labelEn: 'Team' },
      { key: 'digs', labelEs: 'Defensas', labelEn: 'Digs' },
      { key: 'digErrors', labelEs: 'Errores', labelEn: 'Errors' },
      { key: 'total', labelEs: 'Total', labelEn: 'Total' },
      { key: 'averagePerMatch', labelEs: 'Promedio por partido', labelEn: 'Average per match' },
      { key: 'successPercentage', labelEs: 'Éxito %', labelEn: 'Success %' }
    ]
  },
  {
    key: 'reception',
    labelEs: 'Receptores',
    labelEn: 'Best Receivers',
    columns: [
      { key: 'rank', labelEs: 'Rank', labelEn: 'Rank' },
      { key: 'playerName', labelEs: 'Nombre del Jugador', labelEn: 'Player Name' },
      { key: 'team', labelEs: 'Equipo', labelEn: 'Team' },
      { key: 'receptionSuccessful', labelEs: 'Exitosos', labelEn: 'Successful' },
      { key: 'receptionErrors', labelEs: 'Errores', labelEn: 'Errors' },
      { key: 'receptionAttempts', labelEs: 'Intentos', labelEn: 'Attempts' },
      { key: 'averagePerMatch', labelEs: 'Promedio por partido', labelEn: 'Average per match' },
      { key: 'successPercentage', labelEs: 'Éxito %', labelEn: 'Success %' },
      { key: 'total', labelEs: 'Total', labelEn: 'Total' }
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
  const [activeStatCategory, setActiveStatCategory] = useState('scoring');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('all'); // 'all', 'team1', 'team2'
  const [selectedGame, setSelectedGame] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  
  // Estado para preservar los datos ingresados temporalmente por jugador
  const [tempPlayerStats, setTempPlayerStats] = useState({});
  
  // Estado para el modal de éxito
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Estado para la pestaña activa de estadísticas
  const [activeStatsTab, setActiveStatsTab] = useState('scoring');

  const leagueId = activeLeague || localActiveLeague;

  // Funciones auxiliares para recargar datos
  const fetchPlayerAverages = useCallback(async (currentLeagueId = leagueId) => {
    if (!currentLeagueId) return setPlayerAverages([]);
    try {
      const res = await fetch(`${API_BASE_URL}/api/game-stats/player-averages?league=${currentLeagueId}`);
      const data = await res.json();
      setPlayerAverages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching player averages:', error);
      setPlayerAverages([]);
    }
  }, [leagueId]);

  const fetchGameStats = useCallback(async (currentLeagueId = leagueId) => {
    if (!currentLeagueId) {
      return setGameStats([]);
    }
    
    try {
      const url = `${API_BASE_URL}/api/game-stats?league=${currentLeagueId}`;
      
      const res = await fetch(url);
      
      const data = await res.json();
      
      const stats = Array.isArray(data) ? data : [];
      setGameStats(stats);
    } catch (error) {
      console.error('Error fetching game stats:', error);
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

  // Procesa los promedios de jugadores desde la nueva API y calcula estadísticas adicionales
  const allPlayers = playerAverages.map(avg => {
    const totalGames = avg.totalGames || 1;
    
    // Estadísticas básicas (usar los totales, no los promedios)
    const blocks = Number(avg.blocks ?? 0);
    const assists = Number(avg.assists ?? 0);
    const aces = Number(avg.aces ?? 0);
    const attacks = Number(avg.attacks ?? 0);
    const digs = Number(avg.digs ?? 0);
    const hittingErrors = Number(avg.hittingErrors ?? 0);
    const kills = Number(avg.kills ?? 0);
    const points = Number(avg.points ?? 0);
    
    // Estadísticas extendidas
    const attackErrors = Number(avg.attackErrors ?? 0);
    const blockErrors = Number(avg.blockErrors ?? 0);
    const blockTouches = Number(avg.blockTouches ?? 0);
    const serveErrors = Number(avg.serveErrors ?? 0);
    const serveAttempts = Number(avg.serveAttempts ?? 0);
    const setErrors = Number(avg.setErrors ?? 0);
    const setAttempts = Number(avg.setAttempts ?? 0);
    const receptionSuccessful = Number(avg.receptionSuccessful ?? 0);
    const receptionErrors = Number(avg.receptionErrors ?? 0);
    const receptionAttempts = Number(avg.receptionAttempts ?? 0);
    const digErrors = Number(avg.digErrors ?? 0);
    
    // Cálculos para cada categoría
    const attackTotal = kills + attackErrors + attacks;
    const blockTotal = blocks + blockErrors + blockTouches;
    const serveTotal = aces + serveErrors + serveAttempts;
    const setTotal = assists + setErrors + setAttempts;
    const receptionTotal = receptionSuccessful + receptionErrors + receptionAttempts;
    const digTotal = digs + digErrors;
    
    return {
      playerName: avg.playerName,
      team: avg.team,
      totalGames: totalGames,
      
      // Estadísticas básicas
      blocks,
      assists,
      aces,
      attacks,
      digs,
      hittingErrors,
      kills,
      points,
      
      // Estadísticas extendidas
      attackErrors,
      blockErrors,
      blockTouches,
      serveErrors,
      serveAttempts,
      setErrors,
      setAttempts,
      receptionSuccessful,
      receptionErrors,
      receptionAttempts,
      digErrors,
      
      // Totales calculados
      attackTotal,
      blockTotal,
      serveTotal,
      setTotal,
      receptionTotal,
      digTotal,
      
      // Promedios por partido
      averagePerMatch: {
        kills: Math.round((kills / totalGames) * 100) / 100,
        blocks: Math.round((blocks / totalGames) * 100) / 100,
        aces: Math.round((aces / totalGames) * 100) / 100,
        assists: Math.round((assists / totalGames) * 100) / 100,
        digs: Math.round((digs / totalGames) * 100) / 100,
        receptionSuccessful: Math.round((receptionSuccessful / totalGames) * 100) / 100
      },
      
      // Porcentajes de éxito/eficiencia
      successPercentage: {
        attack: attackTotal > 0 ? Math.round((kills / attackTotal) * 100 * 100) / 100 : 0,
        serve: serveTotal > 0 ? Math.round((aces / serveTotal) * 100 * 100) / 100 : 0,
        set: setTotal > 0 ? Math.round((assists / setTotal) * 100 * 100) / 100 : 0,
        reception: receptionTotal > 0 ? Math.round((receptionSuccessful / receptionTotal) * 100 * 100) / 100 : 0,
        dig: digTotal > 0 ? Math.round((digs / digTotal) * 100 * 100) / 100 : 0
      },
      
      // Porcentajes de eficiencia específicos
      efficiencyPercentage: {
        block: blockTotal > 0 ? Math.round(((blocks - blockErrors) / blockTotal) * 100 * 100) / 100 : 0
      }
    };
  });

  // Filtra y ordena jugadores según la categoría
  const filteredStats = (category) => {
    let sortKey;
    let filteredPlayers = allPlayers.filter(p =>
      (!searchQuery ||
        p.playerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.team?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );

    // Determinar por qué campo ordenar según la categoría
    switch (category) {
      case 'scoring':
        sortKey = 'points';
        filteredPlayers = filteredPlayers.filter(p => p.points > 0);
        break;
      case 'attack':
        sortKey = 'kills';
        filteredPlayers = filteredPlayers.filter(p => p.kills > 0);
        break;
      case 'block':
        sortKey = 'blocks';
        filteredPlayers = filteredPlayers.filter(p => p.blocks > 0);
        break;
      case 'serve':
        sortKey = 'aces';
        filteredPlayers = filteredPlayers.filter(p => p.aces > 0);
        break;
      case 'set':
        sortKey = 'assists';
        filteredPlayers = filteredPlayers.filter(p => p.assists > 0);
        break;
      case 'dig':
        sortKey = 'digs';
        filteredPlayers = filteredPlayers.filter(p => p.digs > 0);
        break;
      case 'reception':
        sortKey = 'receptionSuccessful';
        filteredPlayers = filteredPlayers.filter(p => p.receptionSuccessful > 0);
        break;
      default:
        sortKey = 'points';
        filteredPlayers = filteredPlayers.filter(p => p.points > 0);
    }

    return filteredPlayers
      .sort((a, b) => b[sortKey] - a[sortKey])
      .map((player, index) => ({ ...player, rank: index + 1 }));
  };

  const groupedCategories = [];
  for (let i = 0; i < STAT_CATEGORIES.length; i += 2) {
    groupedCategories.push(STAT_CATEGORIES.slice(i, i + 2));
  }

  // Función para obtener la etiqueta según el idioma
  const getColumnLabel = (column, language) => {
    return language === 'en' ? column.labelEn : column.labelEs;
  };

  // Función para obtener el título de la categoría según el idioma
  const getCategoryTitle = (category, language) => {
    return language === 'en' ? category.labelEn : category.labelEs;
  };

  // Función para obtener el valor de una celda según la columna
  const getCellValue = (player, columnKey) => {
    switch (columnKey) {
      case 'rank':
        return player.rank;
      case 'playerName':
        return player.playerName;
      case 'team':
        return player.team;
      case 'points':
        return player.points;
      case 'kills':
        return player.kills;
      case 'blocks':
        return player.blocks;
      case 'aces':
        return player.aces;
      case 'assists':
        return player.assists;
      case 'digs':
        return player.digs;
      case 'attackErrors':
        return player.attackErrors;
      case 'attacks':
        return player.attacks;
      case 'blockErrors':
        return player.blockErrors;
      case 'blockTouches':
        return player.blockTouches;
      case 'serveErrors':
        return player.serveErrors;
      case 'serveAttempts':
        return player.serveAttempts;
      case 'setErrors':
        return player.setErrors;
      case 'setAttempts':
        return player.setAttempts;
      case 'receptionSuccessful':
        return player.receptionSuccessful;
      case 'receptionErrors':
        return player.receptionErrors;
      case 'receptionAttempts':
        return player.receptionAttempts;
      case 'digErrors':
        return player.digErrors;
      case 'total':
        // Retorna el total apropiado según el contexto
        if (player.attackTotal) return player.attackTotal;
        if (player.blockTotal) return player.blockTotal;
        if (player.serveTotal) return player.serveTotal;
        if (player.setTotal) return player.setTotal;
        if (player.receptionTotal) return player.receptionTotal;
        if (player.digTotal) return player.digTotal;
        return 0;
      case 'averagePerMatch':
        // Retorna el promedio apropiado según el contexto de la categoría
        return '--'; // Se calculará dinámicamente
      case 'successPercentage':
        // Retorna el porcentaje apropiado según el contexto
        return '--'; // Se calculará dinámicamente
      case 'efficiencyPercentage':
        // Retorna la eficiencia apropiada según el contexto
        return '--'; // Se calculará dinámicamente
      default:
        return player[columnKey] || 0;
    }
  };

  // Función específica para obtener valores calculados según la categoría
  const getDynamicValue = (player, columnKey, categoryKey) => {
    switch (columnKey) {
      case 'total':
        switch (categoryKey) {
          case 'attack':
            return player.attackTotal;
          case 'block':
            return player.blockTotal;
          case 'serve':
            return player.serveTotal;
          case 'set':
            return player.setTotal;
          case 'dig':
            return player.digTotal;
          case 'reception':
            return player.receptionTotal;
          default:
            return 0;
        }
      case 'averagePerMatch':
        switch (categoryKey) {
          case 'attack':
            return player.averagePerMatch.kills;
          case 'block':
            return player.averagePerMatch.blocks;
          case 'serve':
            return player.averagePerMatch.aces;
          case 'set':
            return player.averagePerMatch.assists;
          case 'dig':
            return player.averagePerMatch.digs;
          case 'reception':
            return player.averagePerMatch.receptionSuccessful;
          default:
            return 0;
        }
      case 'successPercentage':
        switch (categoryKey) {
          case 'attack':
            return player.successPercentage.attack + '%';
          case 'serve':
            return player.successPercentage.serve + '%';
          case 'set':
            return player.successPercentage.set + '%';
          case 'dig':
            return player.successPercentage.dig + '%';
          case 'reception':
            return player.successPercentage.reception + '%';
          default:
            return '0%';
        }
      case 'efficiencyPercentage':
        switch (categoryKey) {
          case 'block':
            return player.efficiencyPercentage.block + '%';
          default:
            return '0%';
        }
      default:
        return getCellValue(player, columnKey);
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
        [statKey]: value,
        // Incluir gameId si hay un juego seleccionado
        ...(selectedGame ? { gameId: selectedGame._id } : {})
      }
    }));
  };
  
  const clearTempPlayerStats = () => {
    setTempPlayerStats({});
  };

  // Función para cargar estadísticas de un juego específico en datos temporales
  const loadGameStats = useCallback((gameId) => {
    if (!gameStats || gameStats.length === 0 || !gameId) {
      return;
    }
    
    const gameSpecificStats = {};
    
    // Filtrar solo las estadísticas del juego seleccionado
    // Convertir ambos valores a string para comparación, ya que gameId podría ser ObjectId o string
    const statsForGame = gameStats.filter(stat => {
      const statGameId = stat.gameId?._id || stat.gameId;
      const currentGameId = gameId;
      return String(statGameId) === String(currentGameId);
    });
    
    statsForGame.forEach(stat => {
      const key = getTempPlayerKey(stat.playerName, stat.team);
      
      gameSpecificStats[key] = {
        setsPlayed: String(stat.setsPlayed || ''),
        blocks: String(stat.blocks || ''),
        assists: String(stat.assists || ''),
        aces: String(stat.aces || ''),
        attacks: String(stat.attacks || ''),
        digs: String(stat.digs || ''),
        hittingErrors: String(stat.hittingErrors || ''),
        kills: String(stat.kills || ''),
        attackErrors: String(stat.attackErrors || ''),
        blockErrors: String(stat.blockErrors || ''),
        blockTouches: String(stat.blockTouches || ''),
        serveErrors: String(stat.serveErrors || ''),
        serveAttempts: String(stat.serveAttempts || ''),
        receptionSuccessful: String(stat.receptionSuccessful || ''),
        receptionErrors: String(stat.receptionErrors || ''),
        receptionAttempts: String(stat.receptionAttempts || ''),
        digErrors: String(stat.digErrors || ''),
        setErrors: String(stat.setErrors || ''),
        setAttempts: String(stat.setAttempts || ''),
        gameId: stat.gameId
      };
    });
    
    setTempPlayerStats(gameSpecificStats);
  }, [gameStats, getTempPlayerKey]);

  // Función para cargar todas las estadísticas existentes en datos temporales (solo cuando no hay juego seleccionado)
  const loadAllExistingStats = () => {
    // Solo limpiar los datos temporales cuando se abre el modal por primera vez
    setTempPlayerStats({});
  };

  // Abrir modal para agregar estadística en una categoría
  const openAddModal = (cat) => {
    setActiveStatCategory(cat);
    setShowAddModal(true);
    setSelectedGame(null);
    setSelectedPlayer(null);
    // Cargar todas las estadísticas existentes al abrir el modal
    loadAllExistingStats();
  };

  // Guardar estadísticas usando la nueva API de game-stats
  const handleSaveStats = async () => {
    if (!selectedGame) return;
    
    // Recopilar datos de los datos temporales y de los inputs en la tabla
    const playersStats = {};
    
    // Primero, obtener citados del juego seleccionado
    const citados = getCitadosList(selectedGame);
    const allGamePlayers = [...citados.team1, ...citados.team2];
    
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
    });

    // Calcular puntos automáticamente para cada jugador (aces + kills + blocks)
    Object.values(playersStats).forEach(stats => {
      stats.points = (stats.aces || 0) + (stats.kills || 0) + (stats.blocks || 0);
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

    if (validStats.length === 0) {
      alert(language === 'en' ? 'Please enter at least one statistic for any player.' : 'Por favor ingrese al menos una estadística para algún jugador.');
      return;
    }

    try {
      // Guardar estadísticas para cada jugador
      const savePromises = validStats.map(async (statsData) => {
        // Verificar si ya existe una estadística para este jugador en este partido
        const existingStats = gameStats.find(
          gs => gs.gameId === selectedGame._id && 
                gs.playerName === statsData.playerName && 
                gs.team === statsData.team
        );

        if (existingStats) {
          // Actualizar estadística existente
          const response = await fetch(`${API_BASE_URL}/api/game-stats/${existingStats._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(statsData)
          });
          
          if (!response.ok) {
            const error = await response.json();
            console.error('Error updating stats:', error);
            throw new Error(error.error || `Error al actualizar estadísticas de ${statsData.playerName}`);
          }
          
          await response.json();
        } else {
          // Crear nueva estadística
          const response = await fetch(`${API_BASE_URL}/api/game-stats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(statsData)
          });

          if (!response.ok) {
            const error = await response.json();
            console.error('Error creating stats:', error);
            throw new Error(error.error || `Error al guardar estadísticas de ${statsData.playerName}`);
          }
          
          await response.json();
        }
      });

      await Promise.all(savePromises);
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
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error saving statistics:', error);
      alert(error.message);
    }
  };

  // Efecto para cargar estadísticas cuando se selecciona un juego
  useEffect(() => {
    if (selectedGame) {
      // Cargar estadísticas existentes del juego seleccionado
      loadGameStats(selectedGame._id);
    } else {
      // Si no hay juego seleccionado, limpiar datos temporales
      setTempPlayerStats({});
    }
  }, [selectedGame, gameStats, loadGameStats]);

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
      if (tempStats[statKey] !== undefined && tempStats[statKey] !== '') {
        return tempStats[statKey];
      }
    }
    
    // Si no hay datos temporales, usar los datos existentes
    if (existingStats) {
      const validFields = [
        'setsPlayed', 'points', 'kills', 'blocks', 'aces', 'hittingErrors', 
        'assists', 'attacks', 'digs', 'attackErrors', 'attackTotal',
        'blockErrors', 'blockTouches', 'blockTotal', 'serveErrors', 
        'serveAttempts', 'serveTotal', 'receptionSuccessful', 
        'receptionErrors', 'receptionAttempts', 'receptionTotal',
        'digErrors', 'digTotal', 'setErrors', 'setAttempts', 'setTotal'
      ];
      
      if (validFields.includes(statKey)) {
        return String(existingStats[statKey] || '');
      }
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
          {/* Botón para agregar estadísticas */}
          {isEditor && (
            <div className="mb-3 d-flex justify-content-start gap-2">
              <button
                className="btn btn-sm btn-primary"
                onClick={() => openAddModal(null)}
              >
                {language === 'en' ? 'Add statistics' : 'Agregar estadísticas'}
              </button>
            </div>
          )}
          {/* Sistema de pestañas para estadísticas */}
          <div className="stats-tabs-container mb-4">
            <div className="stats-tabs-header">
              {STAT_CATEGORIES.map((category) => (
                <button
                  key={category.key}
                  className={`stats-tab-btn ${activeStatsTab === category.key ? 'active' : ''}`}
                  onClick={() => setActiveStatsTab(category.key)}
                >
                  {getCategoryTitle(category, language)}
                </button>
              ))}
            </div>
          </div>

          {/* Tabla de la pestaña activa */}
          <div className="row">
            <div className="col-12">
              {(() => {
                const activeCategory = STAT_CATEGORIES.find(cat => cat.key === activeStatsTab);
                if (!activeCategory) return null;
                
                const stats = filteredStats(activeCategory.key);
                
                return (
                  <div className="card stats-table-card">
                    <div className="card-header stats-table-header d-flex justify-content-between align-items-center">
                      <h4 className="mb-0 fs-4">{getCategoryTitle(activeCategory, language)}</h4>
                    </div>
                    <div className="card-body p-0">
                      <div className="table-responsive">
                        <table className="table stats-table align-middle mb-0">
                          <thead>
                            <tr>
                              {activeCategory.columns.map(col => (
                                <th key={col.key} className="text-center">
                                  {getColumnLabel(col, language)}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {stats.length === 0 ? (
                              <tr>
                                <td colSpan={activeCategory.columns.length} className="text-center" style={{ padding: '40px' }}>
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
                              stats.map((player, idx) => (
                                <tr key={idx}>
                                  {activeCategory.columns.map(col => (
                                    <td key={col.key} className="text-center">
                                      <span className="fw-semibold">
                                        {col.key === 'rank' ? (
                                          <span className="badge bg-primary fs-6">{player.rank}</span>
                                        ) : (
                                          getDynamicValue(player, col.key, activeCategory.key)
                                        )}
                                      </span>
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
                );
              })()}
            </div>
          </div>
          {/* Modal para agregar estadística - Implementación personalizada */}
          {showAddModal && (
            <div 
              className="stats-modal-overlay"
              onClick={() => {
                // No limpiar datos temporales - mantener las estadísticas guardadas
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
                                        // Calcular eficiencia específica según la categoría
                                        const tempStats = getTempPlayerStats(player.name, player.team);
                                        let efficiency = 0;
                                        
                                        if (column.key === 'attackEfficiency') {
                                          // Eficiencia de ataque: (kills/total) - (attackErrors/total) * 100
                                          const kills = Number(tempStats.kills) || Number(existingStats?.kills) || 0;
                                          const errors = Number(tempStats.attackErrors) || Number(existingStats?.attackErrors) || 0;
                                          const attacks = Number(tempStats.attacks) || Number(existingStats?.attacks) || 0;
                                          const total = kills + errors + attacks;
                                          if (total > 0) {
                                            efficiency = Math.round(((kills / total) - (errors / total)) * 100 * 100) / 100;
                                          }
                                        } else if (column.key === 'blockEfficiency') {
                                          // Eficiencia de bloqueo: (blocks/total) - (blockErrors/total) * 100
                                          const blocks = Number(tempStats.blocks) || Number(existingStats?.blocks) || 0;
                                          const errors = Number(tempStats.blockErrors) || Number(existingStats?.blockErrors) || 0;
                                          const touches = Number(tempStats.blockTouches) || Number(existingStats?.blockTouches) || 0;
                                          const total = blocks + errors + touches;
                                          if (total > 0) {
                                            efficiency = Math.round(((blocks / total) - (errors / total)) * 100 * 100) / 100;
                                          }
                                        } else if (column.key === 'serveEfficiency') {
                                          // Eficiencia de saque: (aces/total) - (serveErrors/total) * 100
                                          const aces = Number(tempStats.aces) || Number(existingStats?.aces) || 0;
                                          const errors = Number(tempStats.serveErrors) || Number(existingStats?.serveErrors) || 0;
                                          const attempts = Number(tempStats.serveAttempts) || Number(existingStats?.serveAttempts) || 0;
                                          const total = aces + errors + attempts;
                                          if (total > 0) {
                                            efficiency = Math.round(((aces / total) - (errors / total)) * 100 * 100) / 100;
                                          }
                                        } else if (column.key === 'receptionEfficiency') {
                                          // Eficiencia de recepción: (receptionSuccessful/total) - (receptionErrors/total) * 100
                                          const successful = Number(tempStats.receptionSuccessful) || Number(existingStats?.receptionSuccessful) || 0;
                                          const errors = Number(tempStats.receptionErrors) || Number(existingStats?.receptionErrors) || 0;
                                          const attempts = Number(tempStats.receptionAttempts) || Number(existingStats?.receptionAttempts) || 0;
                                          const total = successful + errors + attempts;
                                          if (total > 0) {
                                            efficiency = Math.round(((successful / total) - (errors / total)) * 100 * 100) / 100;
                                          }
                                        } else if (column.key === 'digEfficiency') {
                                          // Eficiencia de defensa: (digs/total) - (digErrors/total) * 100
                                          const digs = Number(tempStats.digs) || Number(existingStats?.digs) || 0;
                                          const errors = Number(tempStats.digErrors) || Number(existingStats?.digErrors) || 0;
                                          const total = digs + errors;
                                          if (total > 0) {
                                            efficiency = Math.round(((digs / total) - (errors / total)) * 100 * 100) / 100;
                                          }
                                        } else if (column.key === 'setEfficiency') {
                                          // Eficiencia de pase: (assists/total) - (setErrors/total) * 100
                                          const assists = Number(tempStats.assists) || Number(existingStats?.assists) || 0;
                                          const errors = Number(tempStats.setErrors) || Number(existingStats?.setErrors) || 0;
                                          const attempts = Number(tempStats.setAttempts) || Number(existingStats?.setAttempts) || 0;
                                          const total = assists + errors + attempts;
                                          if (total > 0) {
                                            efficiency = Math.round(((assists / total) - (errors / total)) * 100 * 100) / 100;
                                          }
                                        } else {
                                          // Eficiencia general (legacy)
                                          if (existingStats) {
                                            efficiency = Math.round(((existingStats.kills || 0) + (existingStats.blocks || 0) + (existingStats.aces || 0) - (existingStats.hittingErrors || 0)) / Math.max(1, existingStats.points || 1) * 100 * 100) / 100;
                                          }
                                        }
                                        
                                        return (
                                          <td key={column.key} className="efficiency-cell">
                                            <span className="efficiency-value">
                                              {efficiency !== 0 || existingStats ? efficiency : '--'}
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
                                        } else if (baseKey === 'attack') {
                                          // Para ataques: incluir kills + attackErrors + attacks (intentos)
                                          currentTotal = 
                                            (Number(tempStats.kills) || Number(existingStats?.kills) || 0) + 
                                            (Number(tempStats.attackErrors) || Number(existingStats?.attackErrors) || 0) + 
                                            (Number(tempStats.attacks) || Number(existingStats?.attacks) || 0);
                                        } else if (baseKey === 'reception') {
                                          // Para recepción: incluir receptionSuccessful + receptionErrors + receptionAttempts
                                          currentTotal = 
                                            (Number(tempStats.receptionSuccessful) || Number(existingStats?.receptionSuccessful) || 0) + 
                                            (Number(tempStats.receptionErrors) || Number(existingStats?.receptionErrors) || 0) + 
                                            (Number(tempStats.receptionAttempts) || Number(existingStats?.receptionAttempts) || 0);
                                        } else {
                                          // Casos normales: points + errors + attempts
                                          const pointsKey = baseKey === 'block' ? 'blocks' : baseKey === 'serve' ? 'aces' : baseKey === 'set' ? 'assists' : baseKey;
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
                      // No limpiar datos temporales - mantener las estadísticas guardadas
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

          {/* Modal de éxito */}
          {showSuccessModal && (
            <div 
              className="stats-modal-overlay"
              onClick={() => setShowSuccessModal(false)}
            >
              <div 
                className="stats-modal-content"
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: '400px', textAlign: 'center' }}
              >
                <div className="stats-modal-header">
                  <h4 style={{ color: '#28a745', marginBottom: '20px' }}>
                    ✅ {language === 'en' ? 'Success!' : '¡Éxito!'}
                  </h4>
                </div>
                
                <div className="stats-modal-body">
                  <p style={{ fontSize: '16px', marginBottom: '20px' }}>
                    {language === 'en' 
                      ? 'Statistics have been saved successfully!' 
                      : '¡Las estadísticas se han guardado exitosamente!'
                    }
                  </p>
                </div>
                
                <div className="stats-modal-footer">
                  <button
                    className="btn btn-success stats-modal-button"
                    onClick={() => setShowSuccessModal(false)}
                    style={{ minWidth: '120px' }}
                  >
                    {language === 'en' ? 'OK' : 'Aceptar'}
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
