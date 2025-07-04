import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/MediaPage.css';
import '../styles/Teams.css';
import texts from '../translations/texts';
import CloudinaryUpload from '../components/CloudinaryUpload';
import LeagueConfigModal from '../components/LeagueConfigModal'; // Nuevo import
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';
import settingsIcon from '../assets/images/icons8-settings-384.png';
import { API_BASE_URL } from '../assets/Configuration/config';
import { useNavigate, useParams } from 'react-router-dom'; // NUEVO: agregado useParams
import LoadingSpinner from '../components/LoadingSpinner';

// Cambia defaultTeam para solo incluir los campos necesarios
const defaultTeam = {
  name: '',
  abbr: '',
  logo: ''
};

const defaultLeagueConfig = {
  name: '',
  setsToWin: 3,
  lastSetPoints: 15,
  pointsWin: 3,    // NUEVO
  pointsLose: 0    // NUEVO
};

const API_URL = `${API_BASE_URL}/api/teams`;
const LEAGUES_URL = `${API_BASE_URL}/api/leagues`;
const TEAM_LOGO_UPLOAD_URL = `${API_BASE_URL}/api/team-logos`;

const NEW_LEAGUE_OPTION = '__new_league__';

const TeamsPage = ({ language, userRole }) => {
  // Mueve todos los useState arriba, antes de cualquier uso
  // eslint-disable-next-line no-unused-vars
  const [selectedTeam, setSelectedTeam] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [leagueName, setLeagueName] = useState('');
  const [teamCount, setTeamCount] = useState(0);
  const [teams, setTeams] = useState([]);
  const [editingTeam, setEditingTeam] = useState(null);
  const [teamForm, setTeamForm] = useState(defaultTeam);
  const [loading, setLoading] = useState(true);
  const [logoType, setLogoType] = useState('url'); // 'url' o 'file'
  const [logoFile, setLogoFile] = useState(null);
  const [leagues, setLeagues] = useState([]);
  const [leagueConfig, setLeagueConfig] = useState(defaultLeagueConfig);
  const [showLeagueConfigModal, setShowLeagueConfigModal] = useState(false);
  const [showCreateLeague, setShowCreateLeague] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmData, setConfirmData] = useState(null);
  // Estado para el modal de gestión de prioridades de ligas
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [priorityLeagues, setPriorityLeagues] = useState([]);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { leagueParam } = useParams(); // NUEVO: obtener el parámetro de liga de la URL (puede ser ID o nombre)

  // Usa sessionStorage para recordar la última liga seleccionada, pero prioriza la URL
  const [activeLeague, setActiveLeague] = useState(() => {
    // Priorizar el parámetro de URL si existe (se resolverá cuando se carguen las ligas)
    return sessionStorage.getItem('teamsActiveLeague') || '';
  });

  // Guarda la liga seleccionada en sessionStorage cada vez que cambia
  useEffect(() => {
    if (activeLeague) {
      sessionStorage.setItem('teamsActiveLeague', activeLeague);
    }
  }, [activeLeague]);

  // NUEVO: Sincronizar cuando cambia el parámetro de URL
  useEffect(() => {
    if (leagueParam && leagues.length > 0) {
      // Buscar liga por ID o por nombre
      const decodedLeagueParam = decodeURIComponent(leagueParam);
      let foundLeague = leagues.find(l => l._id === leagueParam);
      
      if (!foundLeague) {
        foundLeague = leagues.find(l => l.name === decodedLeagueParam);
      }
      
      if (foundLeague && foundLeague._id !== activeLeague) {
        setActiveLeague(foundLeague._id);
      }
    }
  }, [leagueParam, leagues, activeLeague]);

  // Cuando se cargan las ligas, si hay una liga guardada en sessionStorage y existe en la lista, selecciónala automáticamente
  const fetchLeagues = useCallback(async () => {
    const res = await fetch(LEAGUES_URL);
    let data = await res.json();
    if (!Array.isArray(data)) {
      data = [];
    }
    // El backend ya devuelve las ligas ordenadas por prioridad, no necesitamos reordenar aquí
    // data.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    setLeagues(data);

    // Priorizar parámetro de URL > sessionStorage > primera liga
    let targetLeague = '';
    if (leagueParam && data.length > 0) {
      const decodedLeagueParam = decodeURIComponent(leagueParam);
      // Buscar por ID, código o nombre
      let foundLeague = data.find(l => l._id === leagueParam);
      
      if (!foundLeague) {
        // Buscar por código (preferido)
        foundLeague = data.find(l => l.code === decodedLeagueParam.toUpperCase());
      }
      
      if (!foundLeague) {
        // Buscar por nombre (compatibilidad hacia atrás)
        foundLeague = data.find(l => l.name === decodedLeagueParam);
      }
      
      if (foundLeague) {
        targetLeague = foundLeague._id;
      }
    }
    
    if (!targetLeague) {
      const storedLeague = sessionStorage.getItem('teamsActiveLeague');
      if (storedLeague && data.some(l => l._id === storedLeague)) {
        targetLeague = storedLeague;
      } else if (data.length > 0) {
        targetLeague = data[0]._id;
      }
    }

    if (targetLeague) {
      setActiveLeague(targetLeague);
      sessionStorage.setItem('teamsActiveLeague', targetLeague);
      // Si no estamos en la URL correcta, actualizarla usando el código de la liga
      const targetLeagueObj = data.find(l => l._id === targetLeague);
      const leagueCode = targetLeagueObj ? targetLeagueObj.code : targetLeague;
      if (targetLeague !== activeLeague || leagueParam !== leagueCode) {
        navigate(`/teams/${leagueCode}`, { replace: true });
      }
    } else {
      setActiveLeague('');
      sessionStorage.removeItem('teamsActiveLeague');
    }
  }, [leagueParam, activeLeague, navigate]);

  // Cargar ligas al montar (asegúrate de llamar fetchLeagues en useEffect)
  useEffect(() => {
    setLoading(true); // <-- muestra spinner al cargar ligas
    fetchLeagues().finally(() => setLoading(false));
  }, [fetchLeagues]);

  const fetchTeamsAndLeague = useCallback(async (leagueId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?league=${leagueId}`);
      const data = await res.json();
      // Ordenar equipos alfabéticamente por nombre (case-insensitive)
      const sortedTeams = (data.teams || []).slice().sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );
      setTeams(sortedTeams);
      // Busca el nombre de la liga seleccionada
      // eslint-disable-next-line no-unused-vars
      const leagueObj = leagues.find(l => l._id === leagueId);
      // Elimina setLeagueName aquí, solo muestra el nombre
      // setLeagueName(leagueObj ? leagueObj.name : '');
    } catch {
      setTeams([]);
    }
    setLoading(false);
  }, [leagues]);

  // Solo busca equipos si hay una liga seleccionada
  useEffect(() => {
    if (activeLeague) {
      setLoading(true); // <-- muestra spinner al cargar equipos
      fetchTeamsAndLeague(activeLeague).finally(() => setLoading(false));
    }
  }, [activeLeague, fetchTeamsAndLeague]);

  // Actualizar cantidad de equipos
  useEffect(() => {
    setTeamCount(teams.length);
  }, [teams]);

  // Elimina el efecto que intentaba actualizar el nombre de la liga en el backend
  // ...elimina useEffect sobre leagueName...

  // NUEVO: Manejo de logo file
  // eslint-disable-next-line no-unused-vars
  const handleLogoFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setTeamForm((prev) => ({ ...prev, logo: '' }));

      // Subir al backend y guardar la URL
      const formData = new FormData();
      formData.append('logo', file);
      try {
        const res = await fetch(TEAM_LOGO_UPLOAD_URL, {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          // Guarda la URL absoluta si es relativa
          const url = data.url.startsWith('http')
            ? data.url
            : `${API_BASE_URL}${data.url}`;
          setTeamForm((prev) => ({ ...prev, logo: url }));
        }
      } catch (err) {
        // Maneja el error si lo deseas
      }
    }
  };

  // NUEVO: getLogoPreview ahora solo muestra la URL guardada
  const getLogoPreview = () => {
    if (teamForm.logo) return teamForm.logo;
    return '';
  };

  // NUEVO: Maneja cambios en la configuración de la liga
  const handleLeagueConfigChange = (e) => {
    const { name, value } = e.target;
    setLeagueConfig(prev => ({
      ...prev,
      [name]: ['setsToWin', 'lastSetPoints', 'pointsWin', 'pointsLose'].includes(name) ? Number(value) : value
    }));
    setLeagueName(name === 'name' ? value : leagueConfig.name);
  };

  // Crear nueva liga con configuración
  const handleCreateLeague = async () => {
    if (!leagueConfig.name.trim()) return;
    // Verifica unicidad en frontend (case-insensitive)
    if (leagues.some(l => l.name.trim().toLowerCase() === leagueConfig.name.trim().toLowerCase())) {
      alert(language === 'en'
        ? 'A league with this name already exists.'
        : 'Ya existe una liga con ese nombre.');
      return;
    }
    const res = await fetch(LEAGUES_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: leagueConfig.name,
        setsToWin: leagueConfig.setsToWin,
        lastSetPoints: leagueConfig.lastSetPoints,
        pointsWin: leagueConfig.pointsWin,      // NUEVO
        pointsLose: leagueConfig.pointsLose     // NUEVO
      }),
    });
    if (res.ok) {
      const newLeague = await res.json();
      setLeagueConfig(defaultLeagueConfig);
      setLeagueName('');
      setLeagues(prev => [...prev, newLeague]);
      setActiveLeague(newLeague._id);
      // Actualizar la URL para reflejar la nueva liga usando el código
      navigate(`/teams/${newLeague.code}`, { replace: true });
    } else {
      const data = await res.json();
      alert(data.error || (language === 'en'
        ? 'Could not create league.'
        : 'No se pudo crear la liga.'));
    }
  };

  // Reemplaza handleDeleteLeague para abrir el modal en vez de usar window.confirm
  const handleDeleteLeague = (leagueId) => {
    setShowLeagueConfigModal(false); // Cierra el modal de configuración
    const league = leagues.find(l => l._id === leagueId);
    setConfirmAction('deleteLeague');
    setConfirmData({ leagueId, leagueName: league?.nombre || 'Liga' });
    setShowConfirmModal(true);
  };

  const confirmDeleteLeague = async () => {
    if (confirmData && confirmAction === 'deleteLeague') {
      setShowLeagueConfigModal(false); // Asegura que el modal de configuración esté cerrado
      const res = await fetch(`${LEAGUES_URL}/${confirmData.leagueId}`, { method: 'DELETE' });
      if (res.ok) {
        setLeagues(prev => prev.filter(l => l._id !== confirmData.leagueId));
        if (activeLeague === confirmData.leagueId) {
          const remaining = leagues.filter(l => l._id !== confirmData.leagueId);
          const newActiveLeague = remaining.length > 0 ? remaining[0]._id : '';
          setActiveLeague(newActiveLeague);
          setTeams([]);
          // Actualizar la URL usando el código de la liga
          if (newActiveLeague) {
            const newLeague = remaining[0];
            navigate(`/teams/${newLeague.code}`, { replace: true });
          } else {
            navigate('/teams', { replace: true });
          }
        }
      } else {
        const data = await res.json();
        alert(data.error || (language === 'en'
          ? 'Could not delete league.'
          : 'No se pudo eliminar la liga.'));
      }
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmData(null);
  };

  // Eliminar liga
  // eslint-disable-next-line no-unused-vars
  const handleDeleteLeagueOld = async (leagueId) => {
    if (!window.confirm(language === 'en'
      ? 'Are you sure you want to delete this league and all its teams?'
      : '¿Seguro que deseas eliminar esta liga y todos sus equipos?')) return;
    const res = await fetch(`${LEAGUES_URL}/${leagueId}`, { method: 'DELETE' });
    if (res.ok) {
      setLeagues(prev => prev.filter(l => l._id !== leagueId));
      // Si la liga eliminada era la activa, cambia a otra
      if (activeLeague === leagueId) {
        const remaining = leagues.filter(l => l._id !== leagueId);
        setActiveLeague(remaining.length > 0 ? remaining[0]._id : null);
        setTeams([]);
      }
    } else {
      const data = await res.json();
      alert(data.error || (language === 'en'
        ? 'Could not delete league.'
        : 'No se pudo eliminar la liga.'));
    }
  };

  // Guardar equipo (crear o editar)
  const handleSaveTeam = async (e) => {
    if (e) e.preventDefault();
    if (!teamForm.name || !activeLeague) return;
    setLoading(true);

    let logoToSave = teamForm.logo || '';
    if (logoType === 'file' && logoFile) {
      logoToSave = getLogoPreview();
    }

    const payload = {
      name: teamForm.name,
      abbr: teamForm.abbr || '',
      logo: logoToSave,
      league: activeLeague,
      roster: [], // Inicializar con array vacío
      staff: []   // Inicializar con array vacío
    };

    if (editingTeam && editingTeam !== 'new') {
      // PUT usando el _id del equipo (teamForm._id)
      const teamId = teamForm._id || editingTeam;
      const res = await fetch(`${API_URL}/${teamId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await fetchTeamsAndLeague(activeLeague);
      }
    } else {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await fetchTeamsAndLeague(activeLeague);
      }
    }
    setEditingTeam(null);
    setTeamForm(defaultTeam);
    setLogoFile(null);
    setLogoType('url');
    setLoading(false);
  };

  // Modal de confirmación para eliminar equipo
  const handleDeleteTeam = (idx) => {
    const team = teams[idx];
    setConfirmAction('deleteTeam');
    setConfirmData({ idx, teamName: team.name });
    setShowConfirmModal(true);
  };

  const confirmDeleteTeam = async () => {
    if (confirmData && confirmAction === 'deleteTeam') {
      const teamId = teams[confirmData.idx]._id;
      setLoading(true);
      // eslint-disable-next-line no-unused-vars
      const res = await fetch(`${API_URL}/${teamId}`, { method: 'DELETE' });
      // Elimina el equipo del estado local sin afectar otras secciones ni recargar la liga
      setTeams(prev => prev.filter((_, i) => i !== confirmData.idx));
      setEditingTeam(null);
      setTeamForm(defaultTeam);
      setLoading(false);
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmData(null);
  };

  // Función genérica para manejar confirmaciones
  const handleConfirm = () => {
    if (confirmAction === 'deleteTeam') {
      confirmDeleteTeam();
    } else if (confirmAction === 'deleteLeague') {
      confirmDeleteLeague();
    }
  };

  // Cambia handleShowTeam para navegar con la estructura correcta de URL usando abreviación
  const handleShowTeam = (team) => {
    if (activeLeague) {
      // Usar abreviación si existe, si no usar el nombre del equipo
      const teamIdentifier = team.abbr || team.name;
      // Encontrar el código de la liga
      const currentLeague = leagues.find(l => l._id === activeLeague);
      const leagueCode = currentLeague ? currentLeague.code : activeLeague;
      
      navigate(`/teams/${leagueCode}/${encodeURIComponent(teamIdentifier)}`);
    } else {
      console.warn('No se puede navegar: falta activeLeague', { activeLeague });
    }
  };

  // NOTA: Función comentada ya que se eliminó el botón de editar desde las tarjetas
  // La edición ahora se hace desde la página de detalle del equipo
  /*
  const openEditTeam = (team) => {
    // Asegura que el roster sea array de objetos { name, rut, age, image, stats }
    const roster = Array.isArray(team.roster)
      ? team.roster.map(p =>
          typeof p === 'string'
            ? { 
                name: p, 
                rut: '',
                age: 0,
                image: '', 
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
              }
            : { 
                ...p, 
                rut: p.rut || '',
                age: p.age || 0,
                image: p.image || '', 
                stats: p.stats || { 
                  acesPerSet: 0, 
                  assistsPerSet: 0, 
                  attacksPerSet: 0, 
                  blocksPerSet: 0, 
                  digsPerSet: 0, 
                  hittingPercentage: 0, 
                  killsPerSet: 0, 
                  pointsPerSet: 0 
                } 
              }
        )
      : [];
    setEditingTeam(team._id);
    setTeamForm({ ...team, roster });
    setRosterInput('');
    setStaffInput('');
    setLogoType('url');
    setLogoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  */

  const openAddTeam = () => {
    setEditingTeam('new');
    setTeamForm(defaultTeam);
    setLogoType('url');
    setLogoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTeamFormChange = (e) => {
    const { name, value } = e.target;
    setTeamForm((prev) => ({ ...prev, [name]: value }));
  };

  // NUEVO: callback para guardar la URL de Cloudinary en el formulario
  const handleCloudinaryUpload = (url) => {
    if (url) {
      setTeamForm((prev) => ({ ...prev, logo: url }));
    }
  };

  // Función para manejar el cambio de liga y actualizar la URL
  const handleLeagueSelect = (e) => {
    const selectedLeagueId = e.target.value;
    if (selectedLeagueId === NEW_LEAGUE_OPTION) {
      setShowCreateLeague(true);
      return;
    }
    setActiveLeague(selectedLeagueId);
    // Actualizar la URL para reflejar la liga seleccionada usando el código
    const selectedLeague = leagues.find(l => l._id === selectedLeagueId);
    if (selectedLeague) {
      const leagueCode = selectedLeague.code;
      navigate(`/teams/${leagueCode}`, { replace: true });
    } else {
      navigate('/teams', { replace: true });
    }
  };

  // Estado para edición de configuración de la liga seleccionada
  const [editConfig, setEditConfig] = useState({ setsToWin: 3, lastSetPoints: 15, pointsWin: 3, pointsLose: 0, priority: 100 });

  // Sincroniza editConfig con la liga seleccionada cada vez que cambia activeLeague o leagues
  useEffect(() => {
    if (activeLeague && leagues.length > 0) {
      const liga = leagues.find(l => l._id === activeLeague);
      setEditConfig({
        name: liga?.name ?? '',
        setsToWin: liga?.setsToWin ?? 3,
        lastSetPoints: liga?.lastSetPoints ?? 15,
        pointsWin: liga?.pointsWin ?? 3,
        pointsLose: liga?.pointsLose ?? 0,
        priority: liga?.priority ?? 100
      });
    }
  }, [activeLeague, leagues]);

  // Handler para editar los valores en el modal de configuración
  const handleEditConfigChange = (e) => {
    const { name, value } = e.target;
    setEditConfig(prev => ({
      ...prev,
      [name]: ['setsToWin', 'lastSetPoints', 'pointsWin', 'pointsLose', 'priority'].includes(name) ? Number(value) : value
    }));
  };

  // Guardar cambios de configuración de la liga seleccionada
  const handleSaveEditConfig = async (e) => {
    e && e.preventDefault();
    if (!activeLeague) return;
    setLoading(true);
    try {
      const leagueId = activeLeague;
      const url = `${LEAGUES_URL}/${leagueId}`;
      const payload = {
        name: editConfig.name, // Asegura que el nombre se envía
        setsToWin: editConfig.setsToWin,
        lastSetPoints: editConfig.lastSetPoints,
        pointsWin: editConfig.pointsWin,
        pointsLose: editConfig.pointsLose,
        priority: editConfig.priority
      };
      // Solo intenta si leagueId parece un ObjectId (24 caracteres hex)
      if (!/^[a-fA-F0-9]{24}$/.test(leagueId)) {
        alert('ID de liga inválido. Intenta recargar la página o seleccionar otra liga.');
        setLoading(false);
        return;
      }
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await res.json();
        setLeagues(prev =>
          prev.map(l =>
            l._id === activeLeague
              ? { ...l, ...updated }
              : l
          )
        );
        setShowLeagueConfigModal(false);
      } else {
        const data = await res.json();
        alert(data.error || 'Error updating league');
      }
    } catch (err) {
      alert('Error al guardar la configuración de la liga');
    }
    setLoading(false);
  };

  // Cerrar modal de gestión de prioridades
  const closePriorityModal = () => {
    setShowPriorityModal(false);
    setPriorityLeagues([]);
  };

  // Funciones para gestión de prioridades de ligas
  const openPriorityModal = () => {
    // Copiar las ligas con sus prioridades actuales y ordenarlas por prioridad
    const leaguesWithPriority = leagues.map(league => ({
      ...league,
      priority: league.priority || 100
    })).sort((a, b) => a.priority - b.priority);
    
    setPriorityLeagues(leaguesWithPriority);
    setShowPriorityModal(true);
  };

  const movePriorityUp = (index) => {
    if (index > 0) {
      const newLeagues = [...priorityLeagues];
      // Intercambiar posiciones en el array
      const temp = newLeagues[index];
      newLeagues[index] = newLeagues[index - 1];
      newLeagues[index - 1] = temp;
      
      setPriorityLeagues(newLeagues);
    }
  };

  const movePriorityDown = (index) => {
    if (index < priorityLeagues.length - 1) {
      const newLeagues = [...priorityLeagues];
      // Intercambiar posiciones en el array
      const temp = newLeagues[index];
      newLeagues[index] = newLeagues[index + 1];
      newLeagues[index + 1] = temp;
      
      setPriorityLeagues(newLeagues);
    }
  };

  const savePriorities = async () => {
    setLoading(true);
    try {
      // Obtener información del usuario para autenticación
      const user = JSON.parse(localStorage.getItem('user'));
      
      // Asignar prioridades basadas en la posición en el array (1, 2, 3...)
      const updatePromises = priorityLeagues.map(async (league, index) => {
        const response = await fetch(`${LEAGUES_URL}/${league._id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'user-email': user?.correo || 'admin'
          },
          body: JSON.stringify({
            name: league.name,
            setsToWin: league.setsToWin,
            lastSetPoints: league.lastSetPoints,
            pointsWin: league.pointsWin,
            pointsLose: league.pointsLose,
            priority: index + 1, // La posición determina la prioridad (1, 2, 3...)
            code: league.code,
            user: user // Enviar información del usuario en el body también
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Error updating ${league.name}: ${errorData.error || response.statusText}`);
        }
        
        return response.json();
      });

      await Promise.all(updatePromises);
      
      // Recargar las ligas desde el servidor para asegurar consistencia
      await fetchLeagues();
      closePriorityModal();
      
    } catch (error) {
      console.error('Error updating priorities:', error);
      alert(language === 'en' ? 'Error updating priorities' : 'Error al actualizar las prioridades');
    }
    setLoading(false);
  };

  const handleCloseModal = () => {
    setSelectedTeam(null);
    setEditingTeam(null);
    setTeamForm(defaultTeam);
  };

  return (
    <div className="full-page-container">
      <div className="container">
        {loading && <LoadingSpinner />}
        {!loading && (
          <>
            <h2>{texts[language]?.teams_title || (language === 'en' ? 'Teams' : 'Equipos')}</h2>
          {/* Selector de liga */}
          <div className="mb-4">
            <label className="form-label">{texts[language]?.select_league || (language === 'en' ? 'Select League:' : 'Selecciona Liga:')}</label>
            {/* Si no hay ligas y el usuario es admin/editor, muestra botón para crear la primera liga */}
            {leagues.length === 0 && (userRole === 'content-editor' || userRole === 'admin') ? (
              <div>
                <button
                  className="btn btn-success"
                  onClick={() => setShowCreateLeague(true)}
                >
                  {texts[language]?.create_new_league || (language === 'en' ? 'Create New League' : 'Crear Nueva Liga')}
                </button>
              </div>
            ) : (
              <div className="d-flex align-items-center mb-2" style={{ flexWrap: 'wrap', gap: 8 }}>
                <select
                  className="form-select me-2"
                  value={activeLeague || ''}
                  onChange={handleLeagueSelect}
                  style={{ maxWidth: 300 }}
                >
                  {/* Primera opción: Seleccionar liga */}
                  <option value="" disabled>
                    {texts[language]?.select_league_option || (language === 'en' ? 'Select a league' : 'Selecciona una liga')}
                  </option>
                  {/* Opciones de ligas existentes */}
                  {leagues.map(l => (
                    <option key={l._id} value={l._id}>{l.name}</option>
                  ))}
                  {/* Opción para crear nueva liga (solo para usuarios con permisos) */}
                  {(userRole === 'content-editor' || userRole === 'admin') && (
                    <option value={NEW_LEAGUE_OPTION}>
                      {texts[language]?.create_new_league || (language === 'en' ? 'Create new league...' : 'Agregar nueva liga')}
                    </option>
                  )}
                </select>
                {/* Botón de configuración solo para admin/editor y liga existente */}
                {(userRole === 'content-editor' || userRole === 'admin') && activeLeague && leagues.length > 0 && (
                  <button
                    className="btn btn-link p-0"
                    style={{ border: 'none', background: 'none' }}
                    onClick={() => setShowLeagueConfigModal(true)}
                    title={texts[language]?.league_design || (language === 'en' ? 'League settings' : 'Configuración de liga')}
                  >
                    <img src={settingsIcon} alt="settings" style={{ width: 32, height: 32 }} />
                  </button>
                )}
              </div>
            )}
          </div>
          {/* Modal de configuración de liga (solo para editar liga existente) */}
          {showLeagueConfigModal && activeLeague && (
            <LeagueConfigModal
              league={leagues.find(l => l._id === activeLeague)}
              onSave={handleSaveEditConfig}
              onDelete={() => handleDeleteLeague(activeLeague)}
              onClose={() => setShowLeagueConfigModal(false)}
              loading={loading}
              language={language}
              editConfig={editConfig} // Pasa editConfig y handleEditConfigChange si tu modal lo soporta
              handleEditConfigChange={handleEditConfigChange}
            />
          )}
          {/* Formulario para crear nueva liga */}
          {showCreateLeague && (userRole === 'content-editor' || userRole === 'admin') && (
            <div className="modal-overlay" onClick={() => setShowCreateLeague(false)}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button
                  className="btn btn-secondary close-button"
                  onClick={() => setShowCreateLeague(false)}
                >
                  &times;
                </button>
                <h4>{texts[language]?.create_new_league || (language === 'en' ? 'Create New League' : 'Crear Nueva Liga')}</h4>
                <div className="d-flex flex-column gap-2 mt-3">
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={leagueConfig.name}
                    onChange={handleLeagueConfigChange}
                    placeholder={texts[language]?.league_name_placeholder || (language === 'en' ? 'New league name' : 'Nombre de nueva liga')}
                    style={{ maxWidth: 250 }}
                  />
                  <div>
                    <label className="form-label mb-0 me-1">{texts[language]?.sets_label || (language === 'en' ? 'Sets:' : 'Sets:')}</label>
                    <select
                      className="form-select d-inline-block"
                      name="setsToWin"
                      value={leagueConfig.setsToWin}
                      onChange={handleLeagueConfigChange}
                      style={{ width: 120, display: 'inline-block' }}
                    >
                      <option value={2}>3</option>
                      <option value={3}>5</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label mb-0 me-1">
                      {texts[language]?.last_set_points_label || (language === 'en' ? 'Last set points:' : 'Puntos último set:')}
                    </label>
                    <select
                      className="form-select d-inline-block"
                      name="lastSetPoints"
                      value={leagueConfig.lastSetPoints}
                      onChange={handleLeagueConfigChange}
                      style={{ width: 80, display: 'inline-block' }}
                    >
                      <option value={15}>15</option>
                      <option value={25}>25</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label mb-0 me-1">
                      {language === 'en' ? 'Points for Win:' : 'Puntos por victoria:'}
                    </label>
                    <input
                      type="number"
                      className="form-control d-inline-block"
                      name="pointsWin"
                      value={leagueConfig.pointsWin}
                      onChange={handleLeagueConfigChange}
                      style={{ width: 80, display: 'inline-block' }}
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="form-label mb-0 me-1">
                      {language === 'en' ? 'Points for Loss:' : 'Puntos por derrota:'}
                    </label>
                    <input
                      type="number"
                      className="form-control d-inline-block"
                      name="pointsLose"
                      value={leagueConfig.pointsLose}
                      onChange={handleLeagueConfigChange}
                      style={{ width: 80, display: 'inline-block' }}
                      min={0}
                    />
                  </div>
                  <div className="d-flex gap-2 mt-2">
                    <button className="btn btn-success" onClick={async () => {
                      await handleCreateLeague();
                      setShowCreateLeague(false);
                    }} disabled={loading}>
                      {texts[language]?.create_league || (language === 'en' ? 'Create League' : 'Crear Liga')}
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setShowCreateLeague(false)}
                      disabled={loading}
                    >
                      {texts[language]?.cancel || (language === 'en' ? 'Cancel' : 'Cancelar')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Inputs solo si el usuario es content-editor o admin y hay una liga seleccionada */}
          {(userRole === 'content-editor' || userRole === 'admin') && activeLeague ? (
            <div className="mb-4">
              <label className="form-label">
                {texts[language]?.number_of_teams_label || (language === 'en' ? 'Number of Teams:' : 'Cantidad de Equipos:')}
              </label>
              <input
                type="number"
                className="form-control"
                value={teamCount}
                min={0}
                readOnly
                style={{ width: 'auto' }} // Cambia el ancho aquí
              />
              <div className="d-flex gap-2 mt-3">
                <button className="btn btn-primary" onClick={openAddTeam} disabled={loading}>
                  {texts[language]?.add_team || (language === 'en' ? 'Add Team' : 'Agregar Equipo')}
                </button>
                {/* Botón para gestionar prioridades de ligas - solo para admin */}
                {userRole === 'admin' && leagues.length > 1 && (
                  <button 
                    className="btn btn-outline-secondary" 
                    onClick={openPriorityModal} 
                    disabled={loading}
                    title={language === 'en' ? 'Manage League Priority Order' : 'Gestionar Orden de Prioridad de Ligas'}
                  >
                    <i className="fas fa-sort"></i> {language === 'en' ? 'League Order' : 'Orden de Ligas'}
                  </button>
                )}
              </div>
            </div>
          ) : null}
          <div className="row justify-content-center">
            {teams.length === 0 ? (
              <EmptyState 
                icon="🏐"
                title={language === 'en' ? 'No Teams Yet' : 'Aún no hay equipos'}
                description={
                  (userRole === 'content-editor' || userRole === 'admin') 
                    ? (language === 'en' 
                        ? 'No teams have been created in this league yet. Start by adding your first team.' 
                        : 'Aún no se han creado equipos en esta liga. Comienza agregando tu primer equipo.'
                      )
                    : (language === 'en' 
                        ? 'No teams are registered in this league yet. Check back later.' 
                        : 'Aún no hay equipos registrados en esta liga. Vuelve más tarde.'
                      )
                }
                language={language}
              />
            ) : (
              teams.map((team, idx) => (
              <div
                key={team._id}
                className="col-md-4 mb-3"
              >
                <div
                  className="card h-100 team-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleShowTeam(team)}
                >
                  {team.logo && (
                    <img
                      src={team.logo}
                      className="card-img-top team-logo-img"
                      alt={team.name}
                    />
                  )}
                  <div className="card-body">
                    <h5 className="card-title">{team.name}</h5>
                    {(userRole === 'content-editor' || userRole === 'admin') && (
                      <>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={e => { e.stopPropagation(); handleDeleteTeam(idx); }}
                          disabled={loading}
                        >
                          {language === 'en' ? 'Delete' : 'Eliminar'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )))}
          </div>
          {/* Elimina el modal para ver equipo */}
          {/* Modal para agregar/editar equipo */}
          {(editingTeam !== null) && (userRole === 'content-editor' || userRole === 'admin') && (
            <div className="modal-overlay" onClick={handleCloseModal}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button
                  className="btn btn-secondary close-button"
                  onClick={handleCloseModal}
                >
                  &times;
                </button>
                <h2>{editingTeam !== 'new' ? (language === 'en' ? 'Edit Team' : 'Editar Equipo') : (language === 'en' ? 'Add Team' : 'Agregar Equipo')}</h2>
                <form onSubmit={handleSaveTeam}>
                  <label className="form-label">{language === 'en' ? 'Team Name' : 'Nombre del Equipo'}</label>
                  <input
                    type="text"
                    className="form-control mb-2"
                    name="name"
                    value={teamForm.name}
                    onChange={handleTeamFormChange}
                  />

                  {/* NUEVO: Campo para abreviación */}
                  <label className="form-label">{language === 'en' ? 'Abbreviation' : 'Abreviación'}</label>
                  <input
                    type="text"
                    className="form-control mb-2"
                    name="abbr"
                    value={teamForm.abbr || ''}
                    onChange={handleTeamFormChange}
                    maxLength={6}
                    placeholder={language === 'en' ? 'e.g. UCH' : 'Ej: UCH'}
                    required
                  />

                  {/* NUEVO: Selector de tipo de logo */}
                  <div className="mb-2">
                    <label className="form-label">{language === 'en' ? 'Logo' : 'Logo'}</label>
                    <div className="mb-2">
                      <div className="form-check form-check-inline">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="logoType"
                          id="logoUrl"
                          checked={logoType === 'url'}
                          onChange={() => {
                            setLogoType('url');
                            setLogoFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                        />
                        <label className="form-check-label" htmlFor="logoUrl">
                          {language === 'en' ? 'By URL' : 'Por URL'}
                        </label>
                      </div>
                      <div className="form-check form-check-inline">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="logoType"
                          id="logoFile"
                          checked={logoType === 'file'}
                          onChange={() => {
                            setLogoType('file');
                            setTeamForm((prev) => ({ ...prev, logo: '' }));
                          }}
                        />
                        <label className="form-check-label" htmlFor="logoFile">
                          {language === 'en' ? 'Upload Image' : 'Subir Imagen'}
                        </label>
                      </div>
                    </div>
                    {logoType === 'url' && (
                      <input
                        type="text"
                        className="form-control mb-2"
                        name="logo"
                        value={teamForm.logo}
                        onChange={handleTeamFormChange}
                        placeholder={language === 'en' ? 'Logo URL' : 'URL del Logo'}
                      />
                    )}
                    {logoType === 'file' && (
                      <CloudinaryUpload onUpload={handleCloudinaryUpload} />
                    )}
                    {/* Preview del logo */}
                    {getLogoPreview() && (
                      <div className="mb-2">
                        <img src={getLogoPreview()} alt="logo preview" style={{ maxWidth: 120, marginTop: 8 }} />
                      </div>
                    )}
                  </div>

                  <button className="btn btn-primary mt-3" type="submit" disabled={loading}>
                    {language === 'en' ? 'Save' : 'Guardar'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Elimina el modal para editar stats de jugador */}
          {/* Modal de confirmación unificado */}
          <ConfirmModal
            show={showConfirmModal}
            onHide={() => {
              setShowConfirmModal(false);
              setConfirmAction(null);
              setConfirmData(null);
            }}
            onConfirm={handleConfirm}
            title={
              confirmAction === 'deleteTeam' 
                ? (language === 'en' ? 'Delete Team' : 'Eliminar Equipo')
                : confirmAction === 'deleteLeague'
                ? (language === 'en' ? 'Delete League' : 'Eliminar Liga')
                : ''
            }
            message={
              confirmAction === 'deleteTeam' 
                ? (language === 'en' 
                    ? `Are you sure you want to delete the team "${confirmData?.teamName}"?`
                    : `¿Seguro que deseas eliminar el equipo "${confirmData?.teamName}"?`)
                : confirmAction === 'deleteLeague'
                ? (language === 'en' 
                    ? `Are you sure you want to delete the league "${confirmData?.leagueName}" and all its teams?`
                    : `¿Seguro que deseas eliminar la liga "${confirmData?.leagueName}" y todos sus equipos?`)
                : ''
            }
            confirmText={language === 'en' ? 'Delete' : 'Eliminar'}
            cancelText={language === 'en' ? 'Cancel' : 'Cancelar'}
            confirmVariant="danger"
          />

          {/* Modal de gestión de prioridades de ligas */}
          {showPriorityModal && userRole === 'admin' && (
            <div className="modal-overlay" onClick={closePriorityModal}>
              <div className="modal-content priority-modal" onClick={e => e.stopPropagation()}>
                <button
                  className="btn btn-secondary close-button"
                  onClick={closePriorityModal}
                >
                  &times;
                </button>
                <h2>{language === 'en' ? 'Manage League Priority Order' : 'Gestionar Orden de Prioridad de Ligas'}</h2>
                <p className="text-muted mb-3">
                  {language === 'en' 
                    ? 'Arrange the leagues in order of priority. Position 1 has the highest priority.'
                    : 'Ordena las ligas por prioridad. La posición 1 tiene la mayor prioridad.'
                  }
                </p>
                
                <div className="priority-list">
                  {priorityLeagues.map((league, index) => (
                    <div key={league._id} className="priority-item d-flex align-items-center mb-3">
                      <div className="priority-controls me-3">
                        <button
                          className="btn btn-sm btn-outline-primary priority-btn"
                          onClick={() => movePriorityUp(index)}
                          disabled={index === 0 || loading}
                          title={language === 'en' ? 'Move up' : 'Subir'}
                        >
                          ▲
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary priority-btn"
                          onClick={() => movePriorityDown(index)}
                          disabled={index === priorityLeagues.length - 1 || loading}
                          title={language === 'en' ? 'Move down' : 'Bajar'}
                        >
                          ▼
                        </button>
                      </div>
                      
                      <div className="priority-number me-3">
                        <div className="priority-badge">{index + 1}</div>
                      </div>
                      
                      <div className="league-info flex-grow-1">
                        <strong>{league.name}</strong>
                        {league.code && (
                          <span className="text-muted ms-2">({league.code})</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="d-flex gap-2 mt-4">
                  <button 
                    className="btn btn-primary" 
                    onClick={savePriorities}
                    disabled={loading}
                  >
                    {language === 'en' ? 'Save Order' : 'Guardar Orden'}
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={closePriorityModal}
                    disabled={loading}
                  >
                    {language === 'en' ? 'Cancel' : 'Cancelar'}
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

export default TeamsPage;
