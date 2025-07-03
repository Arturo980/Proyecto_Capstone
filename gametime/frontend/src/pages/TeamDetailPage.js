import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../assets/Configuration/config';
import '../styles/MediaPage.css';
import '../styles/TeamDetailPage.css';
import avatarGenerico from '../assets/images/avatar-generico.jpg';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import CloudinaryUpload from '../components/CloudinaryUpload';
import texts from '../translations/texts';

const TeamDetailPage = ({ language, userRole }) => {
  const { leagueParam, teamParam } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Estado para el modal de edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    abbr: '',
    logo: ''
  });
  const [logoType, setLogoType] = useState('url');
  const [logoFile, setLogoFile] = useState(null);
  const fileInputRef = useRef(null);

  // Estado para el modal de gestión de jugadores
  const [showPlayersModal, setShowPlayersModal] = useState(false);
  const [playerForm, setPlayerForm] = useState({
    name: '',
    age: '',
    height: '',
    position: '',
    image: ''
  });
  const [playerImageType, setPlayerImageType] = useState('url');
  const [playerImageFile, setPlayerImageFile] = useState(null);
  const playerFileInputRef = useRef(null);

  // Estado para el modal de edición de jugador
  const [showEditPlayerModal, setShowEditPlayerModal] = useState(false);
  const [editingPlayerIndex, setEditingPlayerIndex] = useState(null);
  const [editPlayerForm, setEditPlayerForm] = useState({
    name: '',
    age: '',
    height: '',
    position: '',
    image: ''
  });
  const [editPlayerImageType, setEditPlayerImageType] = useState('url');
  const [editPlayerImageFile, setEditPlayerImageFile] = useState(null);
  const editPlayerFileInputRef = useRef(null);

  // Estado para el modal de gestión del coach
  const [showCoachModal, setShowCoachModal] = useState(false);
  const [coachForm, setCoachForm] = useState({
    name: '',
    image: ''
  });
  const [coachImageType, setCoachImageType] = useState('url');
  const [coachImageFile, setCoachImageFile] = useState(null);
  const coachFileInputRef = useRef(null);

  // Función para obtener la traducción de posición
  const getPositionTranslation = (position) => {
    const t = texts[language] || texts.es;
    
    switch(position) {
      case 'Armador':
        return t.position_armador;
      case 'Punta':
        return t.position_punta;
      case 'Central':
        return t.position_central;
      case 'Opuesto':
        return t.position_opuesto;
      case 'Líbero':
        return t.position_libero;
      case 'Sin Posición':
        return t.position_sin_posicion;
      default:
        return position;
    }
  };

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setLoading(true);
        
        const decodedTeamParam = decodeURIComponent(teamParam);
        const decodedLeagueParam = decodeURIComponent(leagueParam);
        let foundTeam = null;
        let actualLeagueId = leagueParam;
        
        // Primero verificar si leagueParam es un ID válido, si no, buscar por código o nombre
        const isValidLeagueId = /^[0-9a-fA-F]{24}$/.test(leagueParam);
        if (!isValidLeagueId) {
          // Buscar liga por código o por nombre para obtener el ID
          const leagueRes = await fetch(`${API_BASE_URL}/api/leagues`);
          const leagueData = await leagueRes.json();
          
          // Primero buscar por código (preferido)
          let foundLeague = leagueData.find(l => l.code === decodedLeagueParam.toUpperCase());
          
          // Si no se encuentra por código, buscar por nombre (compatibilidad hacia atrás)
          if (!foundLeague) {
            foundLeague = leagueData.find(l => l.name === decodedLeagueParam);
          }
          
          if (foundLeague) {
            actualLeagueId = foundLeague._id;
          }
        }
        
        // Ahora verificar si teamParam es un ID válido de MongoDB (24 caracteres hexadecimales)
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(teamParam);
        
        if (isValidObjectId) {
          // Buscar por ID específico
          const url = `${API_BASE_URL}/api/teams?teamId=${teamParam}`;
          
          const res = await fetch(url);
          const data = await res.json();
          
          if (Array.isArray(data.teams) && data.teams.length > 0) {
            foundTeam = data.teams[0];
          }
        } else {
          // Buscar por abreviación o nombre
          // Primero buscar por abreviación
          let url = `${API_BASE_URL}/api/teams?league=${actualLeagueId}&abbr=${decodedTeamParam}`;
          
          let res = await fetch(url);
          let data = await res.json();
          
          if (Array.isArray(data.teams) && data.teams.length > 0) {
            foundTeam = data.teams[0];
          } else {
            // Si no encuentra por abbr, buscar todos los equipos de la liga y filtrar por nombre
            url = `${API_BASE_URL}/api/teams?league=${actualLeagueId}`;
            
            res = await fetch(url);
            data = await res.json();
            
            if (Array.isArray(data.teams) && data.teams.length > 0) {
              foundTeam = data.teams.find(team => 
                team.name === decodedTeamParam || 
                team.name === teamParam
              );
            }
          }
        }
        
        setTeam(foundTeam || null);
      } catch (error) {
        console.error('=== ERROR EN FETCH ===', error);
        setTeam(null);
      }
      setLoading(false);
    };

    if (leagueParam && teamParam) {
      fetchTeam();
    }
  }, [leagueParam, teamParam]);

  // Funciones para el modal de edición
  const openEditModal = () => {
    setEditForm({
      name: team.name || '',
      abbr: team.abbr || '',
      logo: team.logo || ''
    });
    setLogoType('url');
    setLogoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditForm({ name: '', abbr: '', logo: '' });
    setLogoType('url');
    setLogoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCloudinaryUpload = (url) => {
    if (url) {
      setEditForm(prev => ({ ...prev, logo: url }));
    }
  };

  const getLogoPreview = () => {
    if (logoType === 'file' && logoFile) {
      return URL.createObjectURL(logoFile);
    }
    if (editForm.logo) return editForm.logo;
    return null;
  };

  const handleSaveTeam = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) return;
    
    setLoading(true);
    try {
      let logoToSave = editForm.logo || '';
      if (logoType === 'file' && logoFile) {
        logoToSave = getLogoPreview();
      }

      const payload = {
        name: editForm.name.trim(),
        abbr: editForm.abbr.trim(),
        logo: logoToSave,
        league: team.league,
        roster: team.roster || [],
        staff: team.staff || []
      };

      const response = await fetch(`${API_BASE_URL}/api/teams/${team._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const updatedTeam = await response.json();
        setTeam(updatedTeam);
        closeEditModal();
      } else {
        alert(language === 'en' ? 'Error updating team' : 'Error al actualizar el equipo');
      }
    } catch (error) {
      console.error('Error updating team:', error);
      alert(language === 'en' ? 'Error updating team' : 'Error al actualizar el equipo');
    }
    setLoading(false);
  };

  // Funciones para el modal de jugadores
  const openPlayersModal = () => {
    setPlayerForm({
      name: '',
      age: '',
      height: '',
      position: '',
      image: ''
    });
    setPlayerImageType('url');
    setPlayerImageFile(null);
    if (playerFileInputRef.current) playerFileInputRef.current.value = '';
    setShowPlayersModal(true);
  };

  const closePlayersModal = () => {
    setShowPlayersModal(false);
    setPlayerForm({
      name: '',
      age: '',
      height: '',
      position: '',
      image: ''
    });
    setPlayerImageType('url');
    setPlayerImageFile(null);
    if (playerFileInputRef.current) playerFileInputRef.current.value = '';
  };

  const handlePlayerFormChange = (e) => {
    const { name, value } = e.target;
    setPlayerForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePlayerImageUpload = (url) => {
    if (url) {
      setPlayerForm(prev => ({ ...prev, image: url }));
    }
  };

  const getPlayerImagePreview = () => {
    if (playerImageType === 'file' && playerImageFile) {
      return URL.createObjectURL(playerImageFile);
    }
    if (playerForm.image) return playerForm.image;
    return null;
  };

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    if (!playerForm.name.trim()) return;
    
    setLoading(true);
    try {
      let imageToSave = playerForm.image || '';
      if (playerImageType === 'file' && playerImageFile) {
        imageToSave = getPlayerImagePreview();
      }

      const newPlayer = {
        name: playerForm.name.trim(),
        age: parseInt(playerForm.age) || 0,
        height: playerForm.height.trim(),
        position: playerForm.position.trim(),
        image: imageToSave,
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
      };

      const updatedRoster = [...(team.roster || []), newPlayer];

      const payload = {
        name: team.name,
        abbr: team.abbr,
        logo: team.logo,
        league: team.league,
        roster: updatedRoster,
        staff: team.staff || []
      };

      const response = await fetch(`${API_BASE_URL}/api/teams/${team._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const updatedTeam = await response.json();
        setTeam(updatedTeam);
        setPlayerForm({
          name: '',
          age: '',
          height: '',
          position: '',
          image: ''
        });
        setPlayerImageType('url');
        setPlayerImageFile(null);
        if (playerFileInputRef.current) playerFileInputRef.current.value = '';
      } else {
        alert(language === 'en' ? 'Error adding player' : 'Error al agregar jugador');
      }
    } catch (error) {
      console.error('Error adding player:', error);
      alert(language === 'en' ? 'Error adding player' : 'Error al agregar jugador');
    }
    setLoading(false);
  };

  const handleRemovePlayer = async (playerIndex) => {
    if (!window.confirm(language === 'en' ? 'Are you sure you want to remove this player?' : '¿Seguro que deseas eliminar este jugador?')) {
      return;
    }

    setLoading(true);
    try {
      const updatedRoster = team.roster.filter((_, index) => index !== playerIndex);

      const payload = {
        name: team.name,
        abbr: team.abbr,
        logo: team.logo,
        league: team.league,
        roster: updatedRoster,
        staff: team.staff || []
      };

      const response = await fetch(`${API_BASE_URL}/api/teams/${team._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const updatedTeam = await response.json();
        setTeam(updatedTeam);
      } else {
        alert(language === 'en' ? 'Error removing player' : 'Error al eliminar jugador');
      }
    } catch (error) {
      console.error('Error removing player:', error);
      alert(language === 'en' ? 'Error removing player' : 'Error al eliminar jugador');
    }
    setLoading(false);
  };

  // Función para navegar a los detalles del jugador
  const handlePlayerClick = (playerIndex) => {
    navigate(`/teams/${leagueParam}/${teamParam}/player/${playerIndex}`);
  };

  // Funciones para el modal de edición de jugador
  const openEditPlayerModal = (playerIndex) => {
    const player = team.roster[playerIndex];
    setEditingPlayerIndex(playerIndex);
    setEditPlayerForm({
      name: player.name || '',
      age: player.age || '',
      height: player.height || '',
      position: player.position || '',
      image: player.image || ''
    });
    setEditPlayerImageType('url');
    setEditPlayerImageFile(null);
    if (editPlayerFileInputRef.current) editPlayerFileInputRef.current.value = '';
    setShowEditPlayerModal(true);
  };

  const closeEditPlayerModal = () => {
    setShowEditPlayerModal(false);
    setEditingPlayerIndex(null);
    setEditPlayerForm({
      name: '',
      age: '',
      height: '',
      position: '',
      image: ''
    });
    setEditPlayerImageType('url');
    setEditPlayerImageFile(null);
    if (editPlayerFileInputRef.current) editPlayerFileInputRef.current.value = '';
  };

  const handleEditPlayerFormChange = (e) => {
    const { name, value } = e.target;
    setEditPlayerForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditPlayerImageUpload = (url) => {
    if (url) {
      setEditPlayerForm(prev => ({ ...prev, image: url }));
    }
  };

  const getEditPlayerImagePreview = () => {
    if (editPlayerImageType === 'file' && editPlayerImageFile) {
      return URL.createObjectURL(editPlayerImageFile);
    }
    if (editPlayerForm.image) return editPlayerForm.image;
    return null;
  };

  const handleUpdatePlayer = async (e) => {
    e.preventDefault();
    if (!editPlayerForm.name.trim() || editingPlayerIndex === null) return;
    
    setLoading(true);
    try {
      let imageToSave = editPlayerForm.image || '';
      if (editPlayerImageType === 'file' && editPlayerImageFile) {
        imageToSave = getEditPlayerImagePreview();
      }

      const updatedPlayer = {
        name: editPlayerForm.name.trim(),
        age: parseInt(editPlayerForm.age) || 0,
        height: editPlayerForm.height.trim(),
        position: editPlayerForm.position.trim(),
        image: imageToSave,
        stats: team.roster[editingPlayerIndex].stats || {
          acesPerSet: 0,
          assistsPerSet: 0,
          attacksPerSet: 0,
          blocksPerSet: 0,
          digsPerSet: 0,
          hittingPercentage: 0,
          killsPerSet: 0,
          pointsPerSet: 0
        }
      };

      const updatedRoster = [...team.roster];
      updatedRoster[editingPlayerIndex] = updatedPlayer;

      const payload = {
        name: team.name,
        abbr: team.abbr,
        logo: team.logo,
        league: team.league,
        roster: updatedRoster,
        staff: team.staff || []
      };

      const response = await fetch(`${API_BASE_URL}/api/teams/${team._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const updatedTeam = await response.json();
        setTeam(updatedTeam);
        closeEditPlayerModal();
      } else {
        alert(language === 'en' ? 'Error updating player' : 'Error al actualizar jugador');
      }
    } catch (error) {
      console.error('Error updating player:', error);
      alert(language === 'en' ? 'Error updating player' : 'Error al actualizar jugador');
    }
    setLoading(false);
  };

  // Funciones para el modal del coach
  const openCoachModal = () => {
    setCoachForm({
      name: team.coach?.name || '',
      image: team.coach?.image || ''
    });
    setCoachImageType('url');
    setCoachImageFile(null);
    if (coachFileInputRef.current) coachFileInputRef.current.value = '';
    setShowCoachModal(true);
  };

  const closeCoachModal = () => {
    setShowCoachModal(false);
    setCoachForm({ name: '', image: '' });
    setCoachImageType('url');
    setCoachImageFile(null);
    if (coachFileInputRef.current) coachFileInputRef.current.value = '';
  };

  const handleCoachFormChange = (e) => {
    const { name, value } = e.target;
    setCoachForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCoachImageUpload = (url) => {
    if (url) {
      setCoachForm(prev => ({ ...prev, image: url }));
    }
  };

  const getCoachImagePreview = () => {
    if (coachImageType === 'file' && coachImageFile) {
      return URL.createObjectURL(coachImageFile);
    }
    if (coachForm.image) return coachForm.image;
    return null;
  };

  const handleSaveCoach = async (e) => {
    e.preventDefault();
    if (!coachForm.name.trim()) return;
    
    setLoading(true);
    try {
      let imageToSave = coachForm.image || '';
      if (coachImageType === 'file' && coachImageFile) {
        imageToSave = getCoachImagePreview();
      }

      const coachData = {
        name: coachForm.name.trim(),
        image: imageToSave
      };

      const payload = {
        name: team.name,
        abbr: team.abbr,
        logo: team.logo,
        league: team.league,
        roster: team.roster || [],
        staff: team.staff || [],
        coach: coachData
      };

      const response = await fetch(`${API_BASE_URL}/api/teams/${team._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const updatedTeam = await response.json();
        setTeam(updatedTeam);
        closeCoachModal();
      } else {
        alert(language === 'en' ? 'Error updating coach' : 'Error al actualizar entrenador');
      }
    } catch (error) {
      console.error('Error updating coach:', error);
      alert(language === 'en' ? 'Error updating coach' : 'Error al actualizar entrenador');
    }
    setLoading(false);
  };

  const handleRemoveCoach = async () => {
    if (!window.confirm(language === 'en' ? 'Are you sure you want to remove the coach?' : '¿Seguro que deseas eliminar el entrenador?')) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: team.name,
        abbr: team.abbr,
        logo: team.logo,
        league: team.league,
        roster: team.roster || [],
        staff: team.staff || [],
        coach: null
      };

      const response = await fetch(`${API_BASE_URL}/api/teams/${team._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const updatedTeam = await response.json();
        setTeam(updatedTeam);
      } else {
        alert(language === 'en' ? 'Error removing coach' : 'Error al eliminar entrenador');
      }
    } catch (error) {
      console.error('Error removing coach:', error);
      alert(language === 'en' ? 'Error removing coach' : 'Error al eliminar entrenador');
    }
    setLoading(false);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!team) {
    return (
      <div className="team-detail-page-wrapper" style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
        <div className="container mt-5" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Link to="/teams" className="btn btn-secondary mb-3">
            {language === 'en' ? 'Back to Teams' : 'Volver a Equipos'}
          </Link>
          <div className="empty-state-container" style={{ flex: 1 }}>
            <EmptyState
              icon="❌"
              title={language === 'en' ? 'Team Not Found' : 'Equipo No Encontrado'}
              description={
                language === 'en' 
                  ? 'The team you are looking for does not exist or has been removed.' 
                  : 'El equipo que buscas no existe o ha sido eliminado.'
              }
              language={language}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="team-detail-page-wrapper" style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
      <div className="container mt-5" style={{ flex: 1 }}>
        <Link to="/teams" className="btn btn-secondary mb-3">
          {language === 'en' ? 'Back to Teams' : 'Volver a Equipos'}
        </Link>
        
        <div className="d-flex justify-content-between align-items-center mb-4 team-header-responsive">
          <h2 style={{ textAlign: 'center', marginBottom: 0 }}>{team.name}</h2>
          {(userRole === 'content-editor' || userRole === 'admin') && (
            <div className="team-actions">
              <button 
                className="btn btn-outline-primary btn-sm"
                onClick={openEditModal}
              >
                <i className="fas fa-edit"></i>
                {language === 'en' ? 'Edit Team' : 'Editar Equipo'}
              </button>
              <button 
                className="btn btn-primary btn-sm"
                onClick={openPlayersModal}
              >
                <i className="fas fa-users"></i>
                {language === 'en' ? 'Manage Players' : 'Gestionar Jugadores'}
              </button>
              <button 
                className="btn btn-success btn-sm"
                onClick={openCoachModal}
              >
                <i className="fas fa-chalkboard-teacher"></i>
                {texts[language]?.manage_coach || 'Gestionar Entrenador'}
              </button>
            </div>
          )}
        </div>
        
        {/* Sección del Coach */}
        <div className="coach-section mb-4">
          <h3>{texts[language]?.coach || 'Entrenador'}</h3>
          {team.coach && team.coach.name ? (
            <div className="coach-info">
              <div className="d-flex align-items-center">
                <div className="coach-avatar me-3">
                  {team.coach.image ? (
                    <img 
                      src={team.coach.image} 
                      alt={team.coach.name}
                      className="coach-avatar-img"
                      style={{ 
                        width: '60px', 
                        height: '60px', 
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }} 
                    />
                  ) : (
                    <div className="coach-avatar-placeholder">
                      {team.coach.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="coach-details">
                  <h5 className="mb-0">{team.coach.name}</h5>
                  <small className="text-muted">{texts[language]?.coach || 'Entrenador'}</small>
                </div>
                {(userRole === 'content-editor' || userRole === 'admin') && (
                  <div className="coach-actions ms-auto">
                    <button
                      className="btn btn-outline-primary btn-sm me-2"
                      onClick={openCoachModal}
                    >
                      {texts[language]?.edit_coach || 'Editar'}
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={handleRemoveCoach}
                    >
                      {texts[language]?.remove_coach || 'Eliminar'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="no-coach">
              <p className="text-muted">
                {language === 'en' ? 'No coach assigned' : 'Sin entrenador asignado'}
              </p>
              {(userRole === 'content-editor' || userRole === 'admin') && (
                <button
                  className="btn btn-outline-success btn-sm"
                  onClick={openCoachModal}
                >
                  {texts[language]?.add_coach || 'Agregar Entrenador'}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="row justify-content-center team-detail-content" style={{ minHeight: '400px' }}>
          {Array.isArray(team.roster) && team.roster.length > 0 ? (
            <div className="col-12">
              {/* Agrupar jugadores por posición */}
              {(() => {
                // Agrupar jugadores por posición
                const playersByPosition = team.roster.reduce((acc, player, idx) => {
                  if (typeof player === 'object' && player.name) {
                    const position = player.position || 'Sin Posición';
                    if (!acc[position]) {
                      acc[position] = [];
                    }
                    acc[position].push({ ...player, originalIndex: idx });
                  }
                  return acc;
                }, {});

                // Orden de posiciones para mostrar
                const positionOrder = ['Armador', 'Punta', 'Central', 'Opuesto', 'Líbero', 'Sin Posición'];
                
                return positionOrder.map(position => {
                  const playersInPosition = playersByPosition[position];
                  if (!playersInPosition || playersInPosition.length === 0) return null;

                  return (
                    <div key={position} className="position-group mb-4">
                      <h4 className="position-title">
                        {getPositionTranslation(position)}
                      </h4>
                      <div className="row">
                        {playersInPosition.map((player) => (
                          <div 
                            key={player.originalIndex} 
                            className="col-6 col-sm-4 col-md-3 col-lg-2 mb-3 d-flex flex-column align-items-center player-card-clickable"
                            onClick={() => handlePlayerClick(player.originalIndex)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="player-image-container">
                              <img
                                src={player.image || avatarGenerico}
                                alt="avatar"
                                className="player-image"
                              />
                            </div>
                            <div className="player-name" style={{ textAlign: 'center' }}>
                              {player.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            <div className="col-12 empty-state-container">
              <EmptyState
                icon="👥"
                title={language === 'en' ? 'No Players' : 'Sin Jugadores'}
                description={
                  language === 'en' 
                    ? 'This team does not have any players in the roster yet.' 
                    : 'Este equipo aún no tiene jugadores en la plantilla.'
                }
                language={language}
              />
            </div>
          )}
      </div>

      {/* Modal de edición de equipo */}
      {showEditModal && (userRole === 'content-editor' || userRole === 'admin') && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button
              className="btn btn-secondary close-button"
              onClick={closeEditModal}
            >
              &times;
            </button>
            <h2>{language === 'en' ? 'Edit Team' : 'Editar Equipo'}</h2>
            
            <form onSubmit={handleSaveTeam}>
              <label className="form-label">
                {language === 'en' ? 'Team Name' : 'Nombre del Equipo'}
              </label>
              <input
                type="text"
                className="form-control mb-2"
                name="name"
                value={editForm.name}
                onChange={handleEditFormChange}
                required
              />

              <label className="form-label">
                {language === 'en' ? 'Abbreviation' : 'Abreviación'}
              </label>
              <input
                type="text"
                className="form-control mb-2"
                name="abbr"
                value={editForm.abbr}
                onChange={handleEditFormChange}
                maxLength={6}
                placeholder={language === 'en' ? 'e.g. UCH' : 'Ej: UCH'}
                required
              />

              <div className="mb-2">
                <label className="form-label">
                  {language === 'en' ? 'Logo' : 'Logo'}
                </label>
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
                        setEditForm(prev => ({ ...prev, logo: '' }));
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
                    value={editForm.logo}
                    onChange={handleEditFormChange}
                    placeholder={language === 'en' ? 'Logo URL' : 'URL del Logo'}
                  />
                )}
                
                {logoType === 'file' && (
                  <CloudinaryUpload onUpload={handleCloudinaryUpload} />
                )}
                
                {/* Preview del logo */}
                {getLogoPreview() && (
                  <div className="mb-2">
                    <img 
                      src={getLogoPreview()} 
                      alt="logo preview" 
                      style={{ maxWidth: 120, marginTop: 8 }} 
                    />
                  </div>
                )}
              </div>

              <div className="d-flex gap-2 mt-3">
                <button 
                  className="btn btn-primary" 
                  type="submit" 
                  disabled={loading}
                >
                  {language === 'en' ? 'Save Changes' : 'Guardar Cambios'}
                </button>
                <button 
                  className="btn btn-secondary" 
                  type="button" 
                  onClick={closeEditModal}
                  disabled={loading}
                >
                  {language === 'en' ? 'Cancel' : 'Cancelar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de gestión de jugadores */}
      {showPlayersModal && (userRole === 'content-editor' || userRole === 'admin') && (
        <div className="modal-overlay" onClick={closePlayersModal}>
          <div className="modal-content players-modal" onClick={e => e.stopPropagation()}>
            <button
              className="btn btn-secondary close-button"
              onClick={closePlayersModal}
            >
              &times;
            </button>
            <h2>{language === 'en' ? 'Manage Players' : 'Gestionar Jugadores'}</h2>
            
            {/* Formulario para agregar jugador */}
            <div className="player-form-section mb-4">
              <h4>{language === 'en' ? 'Add New Player' : 'Agregar Nuevo Jugador'}</h4>
              <form onSubmit={handleAddPlayer}>
                <div className="row">
                  <div className="col-md-6">
                    <label className="form-label">
                      {language === 'en' ? 'Name' : 'Nombre'} *
                    </label>
                    <input
                      type="text"
                      className="form-control mb-2"
                      name="name"
                      value={playerForm.name}
                      onChange={handlePlayerFormChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">
                      {language === 'en' ? 'Age' : 'Edad'}
                    </label>
                    <input
                      type="number"
                      className="form-control mb-2"
                      name="age"
                      value={playerForm.age}
                      onChange={handlePlayerFormChange}
                      min="15"
                      max="50"
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <label className="form-label">
                      {language === 'en' ? 'Height (cm)' : 'Estatura (cm)'}
                    </label>
                    <input
                      type="number"
                      className="form-control mb-2"
                      name="height"
                      value={playerForm.height}
                      onChange={handlePlayerFormChange}
                      placeholder={language === 'en' ? 'e.g. 185' : 'Ej: 185'}
                      min="150"
                      max="250"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">
                      {language === 'en' ? 'Position' : 'Posición'}
                    </label>
                    <select
                      className="form-select mb-2"
                      name="position"
                      value={playerForm.position}
                      onChange={handlePlayerFormChange}
                    >
                      <option value="">
                        {language === 'en' ? 'Select Position' : 'Seleccionar Posición'}
                      </option>
                      <option value="Armador">{texts[language]?.position_armador || 'Armador'}</option>
                      <option value="Punta">{texts[language]?.position_punta || 'Punta'}</option>
                      <option value="Central">{texts[language]?.position_central || 'Central'}</option>
                      <option value="Opuesto">{texts[language]?.position_opuesto || 'Opuesto'}</option>
                      <option value="Líbero">{texts[language]?.position_libero || 'Líbero'}</option>
                    </select>
                  </div>
                </div>

                {/* Imagen del jugador */}
                <div className="mb-2">
                  <label className="form-label">
                    {language === 'en' ? 'Player Image' : 'Imagen del Jugador'}
                  </label>
                  <div className="mb-2">
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="playerImageType"
                        id="playerImageUrl"
                        checked={playerImageType === 'url'}
                        onChange={() => {
                          setPlayerImageType('url');
                          setPlayerImageFile(null);
                          if (playerFileInputRef.current) playerFileInputRef.current.value = '';
                        }}
                      />
                      <label className="form-check-label" htmlFor="playerImageUrl">
                        {language === 'en' ? 'By URL' : 'Por URL'}
                      </label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="playerImageType"
                        id="playerImageFile"
                        checked={playerImageType === 'file'}
                        onChange={() => {
                          setPlayerImageType('file');
                          setPlayerForm(prev => ({ ...prev, image: '' }));
                        }}
                      />
                      <label className="form-check-label" htmlFor="playerImageFile">
                        {language === 'en' ? 'Upload Image' : 'Subir Imagen'}
                      </label>
                    </div>
                  </div>
                  
                  {playerImageType === 'url' && (
                    <input
                      type="text"
                      className="form-control mb-2"
                      name="image"
                      value={playerForm.image}
                      onChange={handlePlayerFormChange}
                      placeholder={language === 'en' ? 'Image URL' : 'URL de la Imagen'}
                    />
                  )}
                  
                  {playerImageType === 'file' && (
                    <CloudinaryUpload onUpload={handlePlayerImageUpload} />
                  )}
                  
                  {/* Preview de la imagen */}
                  {getPlayerImagePreview() && (
                    <div className="mb-2">
                      <img 
                        src={getPlayerImagePreview()} 
                        alt="player preview" 
                        style={{ 
                          maxWidth: 80, 
                          maxHeight: 80, 
                          marginTop: 8, 
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }} 
                      />
                    </div>
                  )}
                </div>

                <button 
                  className="btn btn-success" 
                  type="submit" 
                  disabled={loading}
                >
                  {language === 'en' ? 'Add Player' : 'Agregar Jugador'}
                </button>
              </form>
            </div>

            {/* Lista de jugadores existentes */}
            <div className="players-list-section">
              <h4>{language === 'en' ? 'Current Players' : 'Jugadores Actuales'}</h4>
              {Array.isArray(team.roster) && team.roster.length > 0 ? (
                <div className="players-list">
                  {team.roster.map((player, index) => (
                    <div key={index} className="player-item">
                      <div className="player-info-row">
                        <div className="player-avatar">
                          {player.image ? (
                            <img 
                              src={player.image} 
                              alt={player.name}
                              className="player-avatar-img"
                            />
                          ) : (
                            <div className="player-avatar-placeholder">
                              {player.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="player-details">
                          <h6 className="player-name-title">{player.name}</h6>
                          <div className="player-meta">
                            {player.age && <span>Edad: {player.age}</span>}
                            {player.height && <span>Estatura: {player.height} cm</span>}
                            {player.position && <span>Posición: {player.position}</span>}
                          </div>
                        </div>
                        <div className="player-actions">
                          <button
                            className="btn btn-outline-primary btn-sm me-2"
                            onClick={() => openEditPlayerModal(index)}
                            disabled={loading}
                          >
                            {language === 'en' ? 'Edit' : 'Editar'}
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleRemovePlayer(index)}
                            disabled={loading}
                          >
                            {language === 'en' ? 'Remove' : 'Eliminar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">
                  {language === 'en' ? 'No players added yet.' : 'Aún no se han agregado jugadores.'}
                </p>
              )}
            </div>

            <div className="d-flex justify-content-end mt-3">
              <button 
                className="btn btn-secondary" 
                onClick={closePlayersModal}
                disabled={loading}
              >
                {language === 'en' ? 'Close' : 'Cerrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición de jugador */}
      {showEditPlayerModal && (userRole === 'content-editor' || userRole === 'admin') && (
        <div className="modal-overlay" onClick={closeEditPlayerModal}>
          <div className="modal-content edit-player-modal" onClick={e => e.stopPropagation()}>
            <button
              className="btn btn-secondary close-button"
              onClick={closeEditPlayerModal}
            >
              &times;
            </button>
            <h2>{language === 'en' ? 'Edit Player' : 'Editar Jugador'}</h2>
            
            <form onSubmit={handleUpdatePlayer}>
              <div className="row">
                <div className="col-md-6">
                  <label className="form-label">
                    {language === 'en' ? 'Name' : 'Nombre'} *
                  </label>
                  <input
                    type="text"
                    className="form-control mb-2"
                    name="name"
                    value={editPlayerForm.name}
                    onChange={handleEditPlayerFormChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    {language === 'en' ? 'Age' : 'Edad'}
                  </label>
                  <input
                    type="number"
                    className="form-control mb-2"
                    name="age"
                    value={editPlayerForm.age}
                    onChange={handleEditPlayerFormChange}
                    min="15"
                    max="50"
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <label className="form-label">
                    {language === 'en' ? 'Height (cm)' : 'Estatura (cm)'}
                  </label>
                  <input
                    type="number"
                    className="form-control mb-2"
                    name="height"
                    value={editPlayerForm.height}
                    onChange={handleEditPlayerFormChange}
                    placeholder={language === 'en' ? 'e.g. 185' : 'Ej: 185'}
                    min="150"
                    max="250"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    {language === 'en' ? 'Position' : 'Posición'}
                  </label>
                  <select
                    className="form-select mb-2"
                    name="position"
                    value={editPlayerForm.position}
                    onChange={handleEditPlayerFormChange}
                  >
                    <option value="">
                      {language === 'en' ? 'Select Position' : 'Seleccionar Posición'}
                    </option>
                    <option value="Armador">{texts[language]?.position_armador || 'Armador'}</option>
                    <option value="Punta">{texts[language]?.position_punta || 'Punta'}</option>
                    <option value="Central">{texts[language]?.position_central || 'Central'}</option>
                    <option value="Opuesto">{texts[language]?.position_opuesto || 'Opuesto'}</option>
                    <option value="Líbero">{texts[language]?.position_libero || 'Líbero'}</option>
                  </select>
                </div>
              </div>

              {/* Imagen del jugador */}
              <div className="mb-2">
                <label className="form-label">
                  {language === 'en' ? 'Player Image' : 'Imagen del Jugador'}
                </label>
                <div className="mb-2">
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="editPlayerImageType"
                      id="editPlayerImageUrl"
                      checked={editPlayerImageType === 'url'}
                      onChange={() => {
                        setEditPlayerImageType('url');
                        setEditPlayerImageFile(null);
                        if (editPlayerFileInputRef.current) editPlayerFileInputRef.current.value = '';
                      }}
                    />
                    <label className="form-check-label" htmlFor="editPlayerImageUrl">
                      {language === 'en' ? 'By URL' : 'Por URL'}
                    </label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="editPlayerImageType"
                      id="editPlayerImageFile"
                      checked={editPlayerImageType === 'file'}
                      onChange={() => {
                        setEditPlayerImageType('file');
                        setEditPlayerForm(prev => ({ ...prev, image: '' }));
                      }}
                    />
                    <label className="form-check-label" htmlFor="editPlayerImageFile">
                      {language === 'en' ? 'Upload Image' : 'Subir Imagen'}
                    </label>
                  </div>
                </div>
                
                {editPlayerImageType === 'url' && (
                  <input
                    type="text"
                    className="form-control mb-2"
                    name="image"
                    value={editPlayerForm.image}
                    onChange={handleEditPlayerFormChange}
                    placeholder={language === 'en' ? 'Image URL' : 'URL de la Imagen'}
                  />
                )}
                
                {editPlayerImageType === 'file' && (
                  <CloudinaryUpload onUpload={handleEditPlayerImageUpload} />
                )}
                
                {/* Preview de la imagen */}
                {getEditPlayerImagePreview() && (
                  <div className="mb-2">
                    <img 
                      src={getEditPlayerImagePreview()} 
                      alt="player preview" 
                      style={{ 
                        maxWidth: 80, 
                        maxHeight: 80, 
                        marginTop: 8, 
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }} 
                    />
                  </div>
                )}
              </div>

              <div className="d-flex gap-2 mt-3">
                <button 
                  className="btn btn-primary" 
                  type="submit" 
                  disabled={loading}
                >
                  {language === 'en' ? 'Update Player' : 'Actualizar Jugador'}
                </button>
                <button 
                  className="btn btn-secondary" 
                  type="button" 
                  onClick={closeEditPlayerModal}
                  disabled={loading}
                >
                  {language === 'en' ? 'Cancel' : 'Cancelar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de gestión del coach */}
      {showCoachModal && (userRole === 'content-editor' || userRole === 'admin') && (
        <div className="modal-overlay" onClick={closeCoachModal}>
          <div className="modal-content coach-modal" onClick={e => e.stopPropagation()}>
            <button
              className="btn btn-secondary close-button"
              onClick={closeCoachModal}
            >
              &times;
            </button>
            <h2>
              {team.coach && team.coach.name 
                ? (texts[language]?.edit_coach || 'Editar Entrenador')
                : (texts[language]?.add_coach || 'Agregar Entrenador')
              }
            </h2>
            
            <form onSubmit={handleSaveCoach}>
              <div className="mb-3">
                <label className="form-label">
                  {texts[language]?.coach_name || 'Nombre del Entrenador'} *
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={coachForm.name}
                  onChange={handleCoachFormChange}
                  placeholder={language === 'en' ? 'Enter coach name' : 'Ingrese el nombre del entrenador'}
                  required
                />
              </div>

              {/* Imagen del coach */}
              <div className="mb-3">
                <label className="form-label">
                  {language === 'en' ? 'Coach Image' : 'Imagen del Entrenador'}
                </label>
                <div className="mb-2">
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="coachImageType"
                      id="coachImageUrl"
                      checked={coachImageType === 'url'}
                      onChange={() => {
                        setCoachImageType('url');
                        setCoachImageFile(null);
                        if (coachFileInputRef.current) coachFileInputRef.current.value = '';
                      }}
                    />
                    <label className="form-check-label" htmlFor="coachImageUrl">
                      {language === 'en' ? 'By URL' : 'Por URL'}
                    </label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="coachImageType"
                      id="coachImageFile"
                      checked={coachImageType === 'file'}
                      onChange={() => {
                        setCoachImageType('file');
                        setCoachForm(prev => ({ ...prev, image: '' }));
                      }}
                    />
                    <label className="form-check-label" htmlFor="coachImageFile">
                      {language === 'en' ? 'Upload Image' : 'Subir Imagen'}
                    </label>
                  </div>
                </div>
                
                {coachImageType === 'url' && (
                  <input
                    type="text"
                    className="form-control mb-2"
                    name="image"
                    value={coachForm.image}
                    onChange={handleCoachFormChange}
                    placeholder={language === 'en' ? 'Image URL' : 'URL de la Imagen'}
                  />
                )}
                
                {coachImageType === 'file' && (
                  <CloudinaryUpload onUpload={handleCoachImageUpload} />
                )}
                
                {/* Preview de la imagen */}
                {getCoachImagePreview() && (
                  <div className="mb-2">
                    <img 
                      src={getCoachImagePreview()} 
                      alt="coach preview" 
                      style={{ 
                        maxWidth: 80, 
                        maxHeight: 80, 
                        marginTop: 8, 
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }} 
                    />
                  </div>
                )}
              </div>

              <div className="d-flex gap-2 mt-3">
                <button 
                  className="btn btn-primary" 
                  type="submit" 
                  disabled={loading || !coachForm.name.trim()}
                >
                  {team.coach && team.coach.name 
                    ? (language === 'en' ? 'Update Coach' : 'Actualizar Entrenador')
                    : (texts[language]?.add_coach || 'Agregar Entrenador')
                  }
                </button>
                <button 
                  className="btn btn-secondary" 
                  type="button" 
                  onClick={closeCoachModal}
                  disabled={loading}
                >
                  {language === 'en' ? 'Cancel' : 'Cancelar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default TeamDetailPage;
