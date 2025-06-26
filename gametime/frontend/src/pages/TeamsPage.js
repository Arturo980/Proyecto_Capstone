import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/MediaPage.css';
import texts from '../translations/texts';
import CloudinaryUpload from '../components/CloudinaryUpload';
import LeagueConfigModal from '../components/LeagueConfigModal'; // Nuevo import
import settingsIcon from '../assets/images/icons8-settings-384.png';
import { API_BASE_URL } from '../assets/Configuration/config';
import { useNavigate } from 'react-router-dom'; // NUEVO
import LoadingSpinner from '../components/LoadingSpinner';

// Cambia defaultTeam.roster a array de objetos
const defaultTeam = {
  name: '',
  abbr: '',
  logo: '',
  roster: [], // [{ name: 'Jugador', stats: {...} }]
  staff: [],
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
  const [rosterInput, setRosterInput] = useState('');
  const [staffInput, setStaffInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [logoType, setLogoType] = useState('url'); // 'url' o 'file'
  const [logoFile, setLogoFile] = useState(null);
  const [leagues, setLeagues] = useState([]);
  const [leagueConfig, setLeagueConfig] = useState(defaultLeagueConfig);
  const [showLeagueConfigModal, setShowLeagueConfigModal] = useState(false);
  const [showCreateLeague, setShowCreateLeague] = useState(false);
  const [showDeleteLeagueModal, setShowDeleteLeagueModal] = useState(false);
  const [leagueToDelete, setLeagueToDelete] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Usa sessionStorage para recordar la última liga seleccionada
  const [activeLeague, setActiveLeague] = useState(() => {
    // Si hay una liga guardada, úsala; si no, deja vacío
    return sessionStorage.getItem('teamsActiveLeague') || '';
  });

  // Guarda la liga seleccionada en sessionStorage cada vez que cambia
  useEffect(() => {
    if (activeLeague) {
      sessionStorage.setItem('teamsActiveLeague', activeLeague);
    }
  }, [activeLeague]);

  // Cargar ligas al montar (asegúrate de llamar fetchLeagues en useEffect)
  useEffect(() => {
    setLoading(true); // <-- muestra spinner al cargar ligas
    fetchLeagues().finally(() => setLoading(false));
  }, []);

  // Cuando se cargan las ligas, si hay una liga guardada en sessionStorage y existe en la lista, selecciónala automáticamente
  const fetchLeagues = async () => {
    const res = await fetch(LEAGUES_URL);
    let data = await res.json();
    if (!Array.isArray(data)) {
      data = [];
    }
    data.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    setLeagues(data);

    // Solo cambia la liga activa si no hay una guardada o la guardada ya no existe
    const storedLeague = sessionStorage.getItem('teamsActiveLeague');
    if (storedLeague && data.some(l => l._id === storedLeague)) {
      setActiveLeague(storedLeague);
    } else if (data.length > 0) {
      setActiveLeague(data[0]._id); // Selecciona la primera liga si existe
      sessionStorage.setItem('teamsActiveLeague', data[0]._id);
    } else {
      setActiveLeague('');
      sessionStorage.removeItem('teamsActiveLeague');
    }
  };

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
    setLeagueToDelete(leagueId);
    setShowDeleteLeagueModal(true);
  };

  const confirmDeleteLeague = async () => {
    if (!leagueToDelete) return;
    setShowLeagueConfigModal(false); // Asegura que el modal de configuración esté cerrado
    const res = await fetch(`${LEAGUES_URL}/${leagueToDelete}`, { method: 'DELETE' });
    if (res.ok) {
      setLeagues(prev => prev.filter(l => l._id !== leagueToDelete));
      if (activeLeague === leagueToDelete) {
        const remaining = leagues.filter(l => l._id !== leagueToDelete);
        setActiveLeague(remaining.length > 0 ? remaining[0]._id : '');
        setTeams([]);
      }
    } else {
      const data = await res.json();
      alert(data.error || (language === 'en'
        ? 'Could not delete league.'
        : 'No se pudo eliminar la liga.'));
    }
    setShowDeleteLeagueModal(false);
    setLeagueToDelete(null);
  };

  const cancelDeleteLeague = () => {
    setShowDeleteLeagueModal(false);
    setLeagueToDelete(null);
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

    // Asegura que el roster sea array de objetos { name, stats }
    const roster = Array.isArray(teamForm.roster)
      ? teamForm.roster.map(p =>
          typeof p === 'string'
            ? { name: p, stats: { acesPerSet: 0, assistsPerSet: 0, attacksPerSet: 0, blocksPerSet: 0, digsPerSet: 0, hittingPercentage: 0, killsPerSet: 0, pointsPerSet: 0 } }
            : { ...p, stats: p.stats || { acesPerSet: 0, assistsPerSet: 0, attacksPerSet: 0, blocksPerSet: 0, digsPerSet: 0, hittingPercentage: 0, killsPerSet: 0, pointsPerSet: 0 } }
        )
      : [];

    const payload = {
      ...teamForm,
      logo: logoToSave,
      league: activeLeague,
      roster,
      staff: Array.isArray(teamForm.staff) ? teamForm.staff : []
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
  const [deleteTeamIdx, setDeleteTeamIdx] = useState(null);

  // Eliminar equipo (con modal)
  const handleDeleteTeam = (idx) => {
    setDeleteTeamIdx(idx);
  };

  const confirmDeleteTeam = async () => {
    if (deleteTeamIdx !== null) {
      const teamId = teams[deleteTeamIdx]._id;
      setLoading(true);
      // eslint-disable-next-line no-unused-vars
      const res = await fetch(`${API_URL}/${teamId}`, { method: 'DELETE' });
      // Elimina el equipo del estado local sin afectar otras secciones ni recargar la liga
      setTeams(prev => prev.filter((_, i) => i !== deleteTeamIdx));
      setEditingTeam(null);
      setTeamForm(defaultTeam);
      setLoading(false);
      setDeleteTeamIdx(null);
    }
  };

  const cancelDeleteTeam = () => setDeleteTeamIdx(null);

  // Cambia handleShowTeam para agregar un pequeño delay antes de navegar
  const handleShowTeam = (team) => {
    setTimeout(() => {
      navigate(`/teams/${team._id}`);
    }, 500); // 180ms de delay para dar feedback visual
  };

  const openEditTeam = (team) => {
    // Asegura que el roster sea array de objetos { name, stats }
    const roster = Array.isArray(team.roster)
      ? team.roster.map(p =>
          typeof p === 'string'
            ? { name: p, stats: { acesPerSet: 0, assistsPerSet: 0, attacksPerSet: 0, blocksPerSet: 0, digsPerSet: 0, hittingPercentage: 0, killsPerSet: 0, pointsPerSet: 0 } }
            : { ...p, stats: p.stats || { acesPerSet: 0, assistsPerSet: 0, attacksPerSet: 0, blocksPerSet: 0, digsPerSet: 0, hittingPercentage: 0, killsPerSet: 0, pointsPerSet: 0 } }
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

  const openAddTeam = () => {
    setEditingTeam('new');
    setTeamForm(defaultTeam);
    setRosterInput('');
    setStaffInput('');
    setLogoType('url');
    setLogoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTeamFormChange = (e) => {
    const { name, value } = e.target;
    setTeamForm((prev) => ({ ...prev, [name]: value }));
  };

  // Cambia handleAddRoster y handleAddStaff para aceptar varios nombres separados por coma o salto de línea
  const handleAddRoster = () => {
    if (rosterInput.trim()) {
      // Permite separar por coma o salto de línea
      const names = rosterInput
        .split(/[\n,]+/)
        .map(n => n.trim())
        .filter(Boolean);
      setTeamForm((prev) => ({
        ...prev,
        roster: [
          ...prev.roster,
          ...names.map(name => ({ name, stats: { ...playerStatsForm } }))
        ],
      }));
      setRosterInput('');
    }
  };

  const handleRemoveRoster = (idx) => {
    setTeamForm((prev) => ({
      ...prev,
      roster: prev.roster.filter((_, i) => i !== idx),
    }));
  };

  // NUEVO: Estado para modal de edición de stats de jugador
  const [editingPlayerStats, setEditingPlayerStats] = useState(null); // { team, player, idx }
  const [playerStatsForm, setPlayerStatsForm] = useState({
    acesPerSet: 0,
    assistsPerSet: 0,
    attacksPerSet: 0,
    blocksPerSet: 0,
    digsPerSet: 0,
    hittingPercentage: 0,
    killsPerSet: 0,
    pointsPerSet: 0
  });

  // NUEVO: Abrir modal de stats de jugador
  // eslint-disable-next-line no-unused-vars
  const openEditPlayerStats = (player, idx) => {
    setEditingPlayerStats({ player, idx });
    setPlayerStatsForm(player.stats || {
      acesPerSet: 0,
      assistsPerSet: 0,
      attacksPerSet: 0,
      blocksPerSet: 0,
      digsPerSet: 0,
      hittingPercentage: 0,
      killsPerSet: 0,
      pointsPerSet: 0
    });
  };

  // NUEVO: Guardar stats de jugador en el roster local y opcionalmente en backend
  // eslint-disable-next-line no-unused-vars
  const handleSavePlayerStats = async () => {
    if (editingPlayerStats) {
      setTeamForm(prev => {
        const newRoster = [...prev.roster];
        newRoster[editingPlayerStats.idx] = {
          ...newRoster[editingPlayerStats.idx],
          stats: { ...playerStatsForm }
        };
        return { ...prev, roster: newRoster };
      });
      // Opcional: guardar en backend stats individuales
      if (activeLeague) {
        await fetch(`${API_BASE_URL}/api/player-stats`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerName: editingPlayerStats.player.name,
            team: teamForm.name,
            league: activeLeague,
            ...playerStatsForm
          })
        });
      }
      setEditingPlayerStats(null);
    }
  };

  // Manejar cambio de liga (mostrar config si eligen "nueva liga")
  const handleLeagueSelect = (e) => {
    const value = e.target.value;
    if (value === NEW_LEAGUE_OPTION) {
      setShowCreateLeague(true);
      // No cambies activeLeague aquí, solo muestra el modal de crear liga
    } else {
      setShowCreateLeague(false);
      setActiveLeague(value);
    }
  };

  // Estado para edición de configuración de la liga seleccionada
  const [editConfig, setEditConfig] = useState({ setsToWin: 3, lastSetPoints: 15, pointsWin: 3, pointsLose: 0 });

  // Sincroniza editConfig con la liga seleccionada cada vez que cambia activeLeague o leagues
  useEffect(() => {
    if (activeLeague && leagues.length > 0) {
      const liga = leagues.find(l => l._id === activeLeague);
      setEditConfig({
        setsToWin: liga?.setsToWin ?? 3,
        lastSetPoints: liga?.lastSetPoints ?? 15,
        pointsWin: liga?.pointsWin ?? 3,      // NUEVO
        pointsLose: liga?.pointsLose ?? 0     // NUEVO
      });
    }
  }, [activeLeague, leagues]);

  // Handler para editar los valores en el modal de configuración
  const handleEditConfigChange = (e) => {
    const { name, value } = e.target;
    setEditConfig(prev => ({
      ...prev,
      [name]: ['setsToWin', 'lastSetPoints', 'pointsWin', 'pointsLose'].includes(name) ? Number(value) : value
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
        pointsLose: editConfig.pointsLose
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

  // NUEVO: callback para guardar la URL de Cloudinary en el formulario
  const handleCloudinaryUpload = (url) => {
    if (url) {
      setTeamForm((prev) => ({ ...prev, logo: url }));
    }
  };

  // Agrega staff(s) al equipo (similar a handleAddRoster)
  const handleAddStaff = () => {
    if (staffInput.trim()) {
      const names = staffInput
        .split(/[\n,]+/)
        .map(n => n.trim())
        .filter(Boolean);
      setTeamForm((prev) => ({
        ...prev,
        staff: [...prev.staff, ...names],
      }));
      setStaffInput('');
    }
  };

  // Elimina un miembro del staff por índice
  const handleRemoveStaff = (idx) => {
    setTeamForm((prev) => ({
      ...prev,
      staff: prev.staff.filter((_, i) => i !== idx),
    }));
  };

  const handleCloseModal = () => {
    setSelectedTeam(null);
    setEditingTeam(null);
    setTeamForm(defaultTeam);
  };

  return (
    <div className="container" style={{ margin: 0 }}>
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
          {/* Modal de confirmación para eliminar liga */}
          {showDeleteLeagueModal && (
            <div className="modal-overlay" onClick={cancelDeleteLeague}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h4>{language === 'en' ? 'Confirm Deletion' : 'Confirmar Eliminación'}</h4>
                <p>
                  {language === 'en'
                    ? 'Are you sure you want to delete this league and all its teams?'
                    : '¿Seguro que deseas eliminar esta liga y todos sus equipos?'}
                </p>
                <div className="delete-league-modal-buttons">
                  <button className="btn btn-danger" style={{ minWidth: 140 }} onClick={confirmDeleteLeague}>
                    {language === 'en' ? 'Delete League' : 'Eliminar Liga'}
                  </button>
                  <button className="btn btn-secondary" style={{ minWidth: 140 }} onClick={cancelDeleteLeague}>
                    {language === 'en' ? 'Cancel' : 'Cancelar'}
                  </button>
                </div>
              </div>
            </div>
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
          {/* Inputs solo si el usuario es content-editor o admin */}
          {(userRole === 'content-editor' || userRole === 'admin') ? (
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
              <button className="btn btn-primary mt-3" onClick={openAddTeam} disabled={loading}>
                {texts[language]?.add_team || (language === 'en' ? 'Add Team' : 'Agregar Equipo')}
              </button>
            </div>
          ) : null}
          <div className="row justify-content-center">
            {teams.map((team, idx) => (
              <div
                key={team._id}
                className="col-md-4 mb-3"
              >
                <div
                  className="card h-100"
                  style={{ cursor: (userRole !== 'content-editor' && userRole !== 'admin') ? 'pointer' : 'default' }}
                  onClick={
                    (userRole !== 'content-editor' && userRole !== 'admin')
                      ? () => handleShowTeam(team)
                      : undefined
                  }
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
                          className="btn btn-outline-info btn-sm me-2"
                          onClick={e => { e.stopPropagation(); handleShowTeam(team); }}
                        >
                          {language === 'en' ? 'View' : 'Ver'}
                        </button>
                        <button
                          className="btn btn-outline-secondary btn-sm me-2"
                          onClick={e => { e.stopPropagation(); openEditTeam(team); }}
                          disabled={loading}
                        >
                          {language === 'en' ? 'Edit' : 'Editar'}
                        </button>
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
            ))}
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

                  <label className="form-label">{language === 'en' ? 'Roster' : 'Plantilla'}</label>
                  <div className="mb-2 d-flex">
                    <textarea
                      className="form-control me-2"
                      value={rosterInput}
                      onChange={e => setRosterInput(e.target.value)}
                      placeholder={
                        language === 'en'
                          ? 'Add player(s), separated by comma or new line'
                          : 'Agregar jugador(es), separados por coma o salto de línea'
                      }
                      rows={1}
                      style={{ resize: 'vertical', minHeight: 38, maxHeight: 120 }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddRoster();
                        }
                      }}
                    />
                    <button className="btn btn-success" type="button" onClick={handleAddRoster}>
                      +
                    </button>
                  </div>
                  <ul>
                    {teamForm.roster.map((playerObj, idx) => (
                      <li key={idx} className="d-flex align-items-center">
                        {playerObj.name}
                        <button
                          className="btn btn-link text-danger ms-2 p-0"
                          type="button"
                          onClick={() => handleRemoveRoster(idx)}
                        >
                          &times;
                        </button>
                      </li>
                    ))}
                  </ul>

                  <label className="form-label">{language === 'en' ? 'Staff' : 'Cuerpo Técnico'}</label>
                  <div className="mb-2 d-flex">
                    <textarea
                      className="form-control me-2"
                      value={staffInput}
                      onChange={e => setStaffInput(e.target.value)}
                      placeholder={
                        language === 'en'
                          ? 'Add staff member(s), separated by comma or new line'
                          : 'Agregar staff, separados por coma o salto de línea'
                      }
                      rows={1}
                      style={{ resize: 'vertical', minHeight: 38, maxHeight: 120 }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddStaff();
                        }
                      }}
                    />
                    <button className="btn btn-success" type="button" onClick={handleAddStaff}>
                      +
                    </button>
                  </div>
                  <ul>
                    {teamForm.staff.map((member, idx) => (
                      <li key={idx} className="d-flex align-items-center">
                        {member}
                        <button
                          className="btn btn-link text-danger ms-2 p-0"
                          type="button"
                          onClick={() => handleRemoveStaff(idx)}
                        >
                          &times;
                        </button>
                      </li>
                    ))}
                  </ul>

                  <button className="btn btn-primary mt-3" type="submit" disabled={loading}>
                    {language === 'en' ? 'Save' : 'Guardar'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Modal de confirmación para eliminar equipo */}
          {deleteTeamIdx !== null && (
            <div className="modal-overlay" onClick={cancelDeleteTeam}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h4>{language === 'en' ? 'Confirm Deletion' : 'Confirmar Eliminación'}</h4>
                <p>
                  {language === 'en'
                    ? 'Are you sure you want to delete this team?'
                    : '¿Seguro que deseas eliminar este equipo?'}
                </p>
                <button className="btn btn-danger me-2" onClick={confirmDeleteTeam}>
                  {language === 'en' ? 'Delete' : 'Eliminar'}
                </button>
                <button className="btn btn-secondary" onClick={cancelDeleteTeam}>
                  {language === 'en' ? 'Cancel' : 'Cancelar'}
                </button>
              </div>
            </div>
          )}

          {/* Elimina el modal para editar stats de jugador */}
        </>
      )}
    </div>
  );
};

export default TeamsPage;
