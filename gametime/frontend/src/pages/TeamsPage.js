import React, { useState, useEffect, useRef } from 'react';
import '../styles/MediaPage.css';
import texts from '../translations/texts';

const defaultTeam = {
  name: '',
  logo: '',
  roster: [],
  staff: [],
};

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/teams';
const LEAGUES_URL = process.env.REACT_APP_API_URL?.replace('/teams', '/leagues') || 'http://localhost:3001/api/leagues';

const TeamsPage = ({ language, userRole }) => {
  const [selectedTeam, setSelectedTeam] = useState(null);
  // Elimina leagueName del estado inicial, solo úsalo para crear nueva liga
  const [leagueName, setLeagueName] = useState('');
  const [teamCount, setTeamCount] = useState(0);

  const [teams, setTeams] = useState([]);
  const [editingTeam, setEditingTeam] = useState(null);
  const [teamForm, setTeamForm] = useState(defaultTeam);
  const [rosterInput, setRosterInput] = useState('');
  const [staffInput, setStaffInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoType, setLogoType] = useState('url'); // 'url' o 'file'
  const [logoFile, setLogoFile] = useState(null);
  const [leagues, setLeagues] = useState([]);
  const [activeLeague, setActiveLeague] = useState(null);
  const fileInputRef = useRef(null);

  // Cargar ligas y equipos al montar
  useEffect(() => {
    fetchLeagues();
  }, []);

  useEffect(() => {
    if (activeLeague) fetchTeamsAndLeague(activeLeague);
  }, [activeLeague]);

  const fetchLeagues = async () => {
    const res = await fetch(LEAGUES_URL);
    let data = await res.json();
    if (!Array.isArray(data)) {
      data = [];
    }
    // Ordenar alfabéticamente por nombre (case-insensitive)
    data.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    setLeagues(data);
    if (data.length > 0) setActiveLeague(data[0]._id);
  };

  const fetchTeamsAndLeague = async (leagueId) => {
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
      const leagueObj = leagues.find(l => l._id === leagueId);
      // Elimina setLeagueName aquí, solo muestra el nombre
      // setLeagueName(leagueObj ? leagueObj.name : '');
    } catch {
      setTeams([]);
    }
    setLoading(false);
  };

  // Actualizar cantidad de equipos
  useEffect(() => {
    setTeamCount(teams.length);
  }, [teams]);

  // Elimina el efecto que intentaba actualizar el nombre de la liga en el backend
  // ...elimina useEffect sobre leagueName...

  // NUEVO: Manejo de logo file
  const handleLogoFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
      setTeamForm((prev) => ({ ...prev, logo: '' }));
    }
  };

  // NUEVO: Subida de imagen (solo preview local, no persistente)
  const getLogoPreview = () => {
    if (logoType === 'file' && logoFile) {
      return URL.createObjectURL(logoFile);
    }
    if (logoType === 'url' && teamForm.logo) {
      return teamForm.logo;
    }
    return '';
  };

  // Crear nueva liga
  const handleCreateLeague = async () => {
    if (!leagueName.trim()) return;
    // Verifica unicidad en frontend (case-insensitive)
    if (leagues.some(l => l.name.trim().toLowerCase() === leagueName.trim().toLowerCase())) {
      alert(language === 'en'
        ? 'A league with this name already exists.'
        : 'Ya existe una liga con ese nombre.');
      return;
    }
    const res = await fetch(LEAGUES_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: leagueName }),
    });
    if (res.ok) {
      const newLeague = await res.json();
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

  // Eliminar liga
  const handleDeleteLeague = async (leagueId) => {
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
  const handleSaveTeam = async () => {
    if (!teamForm.name || !activeLeague) return;
    setLoading(true);

    let logoToSave = teamForm.logo;
    if (logoType === 'file' && logoFile) {
      logoToSave = getLogoPreview();
    }

    // Asegura que el equipo tenga el ID de la liga seleccionada
    const payload = { ...teamForm, logo: logoToSave, league: activeLeague };

    if (editingTeam !== null && editingTeam !== 'new') {
      const teamId = teams[editingTeam]._id;
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

  // Eliminar equipo
  const handleDeleteTeam = async (idx) => {
    const teamId = teams[idx]._id;
    setLoading(true);
    const res = await fetch(`${API_URL}/${teamId}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchTeamsAndLeague();
    }
    setEditingTeam(null);
    setTeamForm(defaultTeam);
    setLoading(false);
  };

  const handleShowTeam = (team) => {
    setSelectedTeam(team);
  };

  const handleCloseModal = () => {
    setSelectedTeam(null);
    setEditingTeam(null);
    setTeamForm(defaultTeam);
  };

  useEffect(() => {
    if (selectedTeam || editingTeam !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [selectedTeam, editingTeam]);

  const openEditTeam = (team, idx) => {
    setEditingTeam(idx);
    setTeamForm({ ...team });
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

  const handleAddRoster = () => {
    if (rosterInput.trim()) {
      setTeamForm((prev) => ({
        ...prev,
        roster: [...prev.roster, rosterInput.trim()],
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

  const handleAddStaff = () => {
    if (staffInput.trim()) {
      setTeamForm((prev) => ({
        ...prev,
        staff: [...prev.staff, staffInput.trim()],
      }));
      setStaffInput('');
    }
  };

  const handleRemoveStaff = (idx) => {
    setTeamForm((prev) => ({
      ...prev,
      staff: prev.staff.filter((_, i) => i !== idx),
    }));
  };

  return (
    <div className="container mt-5">
      <h2>{texts[language]?.teams_title || (language === 'en' ? 'Teams' : 'Equipos')}</h2>
      {/* Selector de liga */}
      <div className="mb-4">
        <label className="form-label">{language === 'en' ? 'Select League:' : 'Selecciona Liga:'}</label>
        <div className="d-flex align-items-center mb-2" style={{ flexWrap: 'wrap', gap: 8 }}>
          <select
            className="form-select me-2"
            value={activeLeague || ''}
            onChange={e => setActiveLeague(e.target.value)}
            style={{ maxWidth: 300 }}
          >
            {(Array.isArray(leagues) ? leagues : []).map(l => (
              <option key={l._id} value={l._id}>{l.name}</option>
            ))}
          </select>
          {/* Solo un botón para eliminar la liga seleccionada */}
          {(userRole === 'content-editor' || userRole === 'admin') && activeLeague && (
            <button
              className="btn btn-danger btn-sm"
              onClick={() => handleDeleteLeague(activeLeague)}
              title={
                language === 'en'
                  ? 'Delete league and all its teams'
                  : 'Eliminar liga y todos sus equipos'
              }
              disabled={loading}
            >
              {language === 'en' ? 'Delete League' : 'Eliminar Liga'}
            </button>
          )}
        </div>
        {(userRole === 'content-editor' || userRole === 'admin') && (
          <div className="d-flex">
            <input
              type="text"
              className="form-control me-2"
              value={leagueName}
              onChange={e => setLeagueName(e.target.value)}
              placeholder={language === 'en' ? 'New league name' : 'Nombre de nueva liga'}
            />
            <button className="btn btn-success" onClick={handleCreateLeague} disabled={loading}>
              {language === 'en' ? 'Create League' : 'Crear Liga'}
            </button>
          </div>
        )}
      </div>

      {/* Inputs solo si el usuario es content-editor o admin */}
      {(userRole === 'content-editor' || userRole === 'admin') ? (
        <div className="mb-4">
          {/* Elimina input para editar nombre de liga */}
          <label className="form-label">
            {texts[language]?.number_of_teams_label || (language === 'en' ? 'Number of Teams:' : 'Cantidad de Equipos:')}
          </label>
          <input
            type="number"
            className="form-control"
            value={teamCount}
            min={0}
            readOnly
          />
          <button className="btn btn-primary mt-3" onClick={openAddTeam} disabled={loading}>
            {language === 'en' ? 'Add Team' : 'Agregar Equipo'}
          </button>
        </div>
      ) : null}

      <div className="row justify-content-center">
        {teams.map((team, idx) => (
          <div
            key={team._id}
            className="col-md-4 mb-3"
            style={{ cursor: 'pointer' }}
            onClick={
              (userRole !== 'content-editor' && userRole !== 'admin')
                ? () => handleShowTeam(team)
                : undefined
            }
          >
            <div className="card h-100">
              {team.logo && (
                <img src={team.logo} className="card-img-top" alt={team.name} />
              )}
              <div className="card-body">
                <h5 className="card-title">{team.name}</h5>
                {(userRole === 'content-editor' || userRole === 'admin') && (
                  <>
                    <button
                      className="btn btn-outline-info btn-sm me-2"
                      onClick={() => handleShowTeam(team)}
                    >
                      {language === 'en' ? 'View' : 'Ver'}
                    </button>
                    <button
                      className="btn btn-outline-secondary btn-sm me-2"
                      onClick={() => openEditTeam(team, idx)}
                      disabled={loading}
                    >
                      {language === 'en' ? 'Edit' : 'Editar'}
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleDeleteTeam(idx)}
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

      {/* Modal para ver equipo */}
      {selectedTeam && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target.classList.contains('modal-overlay')) {
              handleCloseModal();
            }
          }}
        >
          <div className="modal-content">
            <button
              className="btn btn-secondary close-button"
              onClick={handleCloseModal}
            >
              &times;
            </button>
            <h2>{selectedTeam.name}</h2>
            {selectedTeam.logo && (
              <img src={selectedTeam.logo} alt={selectedTeam.name} style={{ maxWidth: 120, marginBottom: 16 }} />
            )}
            <h3>{language === 'en' ? 'Roster' : 'Plantilla'}</h3>
            <div className="roster-grid">
              {selectedTeam.roster.map((player, index) => (
                <div key={index} className="player-card">
                  {player}
                </div>
              ))}
            </div>
            <div>
              <h4>{language === 'en' ? 'Staff' : 'Cuerpo Técnico'}</h4>
              <ul>
                {selectedTeam.staff.map((member, index) => (
                  <li key={index}>{member}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

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
            <label className="form-label">{language === 'en' ? 'Team Name' : 'Nombre del Equipo'}</label>
            <input
              type="text"
              className="form-control mb-2"
              name="name"
              value={teamForm.name}
              onChange={handleTeamFormChange}
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
                <input
                  type="file"
                  className="form-control mb-2"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleLogoFileChange}
                />
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
              <input
                type="text"
                className="form-control me-2"
                value={rosterInput}
                onChange={e => setRosterInput(e.target.value)}
                placeholder={language === 'en' ? 'Add player' : 'Agregar jugador'}
              />
              <button className="btn btn-success" type="button" onClick={handleAddRoster}>
                +
              </button>
            </div>
            <ul>
              {teamForm.roster.map((player, idx) => (
                <li key={idx} className="d-flex align-items-center">
                  {player}
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
              <input
                type="text"
                className="form-control me-2"
                value={staffInput}
                onChange={e => setStaffInput(e.target.value)}
                placeholder={language === 'en' ? 'Add staff' : 'Agregar staff'}
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

            <button className="btn btn-primary mt-3" onClick={handleSaveTeam} disabled={loading}>
              {language === 'en' ? 'Save' : 'Guardar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsPage;
