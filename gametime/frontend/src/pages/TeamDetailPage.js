import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_BASE_URL } from '../assets/Configuration/config';
import '../styles/MediaPage.css';
import '../styles/Teams.css';
import avatarGenerico from '../assets/images/avatar-generico.jpg';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import CloudinaryUpload from '../components/CloudinaryUpload';

const TeamDetailPage = ({ language, userRole }) => {
  const { leagueId, teamId } = useParams();
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
    rut: '',
    age: '',
    position: '',
    image: ''
  });
  const [playerImageType, setPlayerImageType] = useState('url');
  const [playerImageFile, setPlayerImageFile] = useState(null);
  const playerFileInputRef = useRef(null);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setLoading(true);
        
        console.log('=== INICIANDO BÚSQUEDA DE EQUIPO ===');
        console.log('TeamId:', teamId);
        console.log('LeagueId:', leagueId);
        console.log('URL completa:', window.location.href);
        
        // Buscar equipo específico por ID usando query parameter
        const url = `${API_BASE_URL}/api/teams?teamId=${teamId}`;
        console.log('URL de consulta:', url);
        
        const res = await fetch(url);
        const data = await res.json();
        
        console.log('=== RESPUESTA DEL BACKEND ===');
        console.log('Status:', res.status);
        console.log('Data completa:', JSON.stringify(data, null, 2));
        
        let foundTeam = null;
        if (Array.isArray(data.teams) && data.teams.length > 0) {
          foundTeam = data.teams[0];
          console.log('=== EQUIPO ENCONTRADO ===');
          console.log('ID del equipo:', foundTeam._id);
          console.log('Nombre:', foundTeam.name);
          console.log('Abreviación:', foundTeam.abbr);
          console.log('Roster completo:', JSON.stringify(foundTeam.roster, null, 2));
          console.log('Cantidad de jugadores:', foundTeam.roster ? foundTeam.roster.length : 0);
        } else {
          console.log('=== NO SE ENCONTRÓ EQUIPO ===');
          console.log('Teams array:', data.teams);
        }
        
        setTeam(foundTeam || null);
      } catch (error) {
        console.error('=== ERROR EN FETCH ===', error);
        setTeam(null);
      }
      setLoading(false);
    };

    if (leagueId && teamId) {
      fetchTeam();
    } else {
      console.log('=== PARÁMETROS FALTANTES ===');
      console.log('LeagueId:', leagueId);
      console.log('TeamId:', teamId);
    }
  }, [leagueId, teamId]);

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
      rut: '',
      age: '',
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
      rut: '',
      age: '',
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
    if (!playerForm.name.trim() || !playerForm.rut.trim()) return;
    
    setLoading(true);
    try {
      let imageToSave = playerForm.image || '';
      if (playerImageType === 'file' && playerImageFile) {
        imageToSave = getPlayerImagePreview();
      }

      const newPlayer = {
        name: playerForm.name.trim(),
        rut: playerForm.rut.trim(),
        age: parseInt(playerForm.age) || 0,
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
          rut: '',
          age: '',
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

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!team) {
    return (
      <div className="container mt-5">
        <Link to="/teams" className="btn btn-secondary mb-3">
          {language === 'en' ? 'Back to Teams' : 'Volver a Equipos'}
        </Link>
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
    );
  }

  return (
    <div className="container mt-5">
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
          </div>
        )}
      </div>
      <div className="row justify-content-center">
        {/* Log de debug para verificar el roster */}
        {console.log('Renderizando roster para equipo:', { 
          teamName: team.name, 
          teamId: team._id,
          rosterLength: team.roster ? team.roster.length : 0,
          roster: team.roster 
        })}
        {Array.isArray(team.roster) && team.roster.length > 0 ? (
          <div className="row" style={{ maxWidth: 1200, margin: '0 auto' }}>
            {team.roster.map((player, idx) => (
              <div key={idx} className="col-6 col-sm-4 col-md-3 col-lg-2 mb-4 d-flex flex-column align-items-center">
                <div className="player-image-container">
                  <img
                    src={
                      (typeof player === 'object' && player.image) 
                        ? player.image 
                        : avatarGenerico
                    }
                    alt="avatar"
                    className="player-image"
                  />
                </div>
                <div className="player-name">
                  {typeof player === 'string' ? player : player.name}
                  {typeof player === 'object' && (player.age || player.rut) && (
                    <div style={{ fontSize: '12px', fontWeight: 'normal', color: '#666', marginTop: '4px' }}>
                      {player.age && `${player.age} ${language === 'en' ? 'years' : 'años'}`}
                      {player.age && player.rut && ' • '}
                      {player.rut}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="col-12">
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
                      {language === 'en' ? 'RUT' : 'RUT'} *
                    </label>
                    <input
                      type="text"
                      className="form-control mb-2"
                      name="rut"
                      value={playerForm.rut}
                      onChange={handlePlayerFormChange}
                      placeholder="12.345.678-9"
                      required
                    />
                  </div>
                </div>

                <div className="row">
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
                      <option value="Setter">{language === 'en' ? 'Setter' : 'Armador'}</option>
                      <option value="Outside Hitter">{language === 'en' ? 'Outside Hitter' : 'Atacante Exterior'}</option>
                      <option value="Middle Blocker">{language === 'en' ? 'Middle Blocker' : 'Bloqueador Central'}</option>
                      <option value="Opposite Hitter">{language === 'en' ? 'Opposite Hitter' : 'Opuesto'}</option>
                      <option value="Libero">{language === 'en' ? 'Libero' : 'Líbero'}</option>
                      <option value="Defensive Specialist">{language === 'en' ? 'Defensive Specialist' : 'Especialista Defensivo'}</option>
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
                            {player.rut && <span>RUT: {player.rut}</span>}
                            {player.age && <span>Edad: {player.age}</span>}
                            {player.position && <span>Posición: {player.position}</span>}
                          </div>
                        </div>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleRemovePlayer(index)}
                          disabled={loading}
                        >
                          {language === 'en' ? 'Remove' : 'Eliminar'}
                        </button>
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
    </div>
  );
};

export default TeamDetailPage;
