import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../assets/Configuration/config';
import { Modal, Button, Form, Table, Badge } from 'react-bootstrap';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const GameStatsManagement = ({ language = 'es' }) => {
  const [loading, setLoading] = useState(true);
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState('');
  const [games, setGames] = useState([]);
  const [gameStats, setGameStats] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStats, setEditingStats] = useState(null);
  const [editForm, setEditForm] = useState({
    setsPlayed: '',
    aces: '',
    assists: '',
    attacks: '',
    blocks: '',
    digs: '',
    hittingErrors: '',
    kills: '',
    points: ''
  });

  // Cargar ligas
  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/leagues`);
        const data = await res.json();
        const leagueList = Array.isArray(data) ? data : data.leagues || [];
        setLeagues(leagueList);
        if (leagueList.length > 0) {
          setSelectedLeague(leagueList[0]._id);
        }
      } catch {
        setLeagues([]);
      }
      setLoading(false);
    };
    fetchLeagues();
  }, []);

  // Cargar partidos finalizados
  useEffect(() => {
    const fetchGames = async () => {
      if (!selectedLeague) return setGames([]);
      try {
        const res = await fetch(`${API_BASE_URL}/api/games?league=${selectedLeague}`);
        const data = await res.json();
        const finishedGames = (Array.isArray(data.games) ? data.games : [])
          .filter(g => g.partidoFinalizado);
        setGames(finishedGames);
      } catch {
        setGames([]);
      }
    };
    fetchGames();
  }, [selectedLeague]);

  // Cargar estadísticas de partidos
  useEffect(() => {
    const fetchGameStats = async () => {
      if (!selectedLeague) return setGameStats([]);
      try {
        const res = await fetch(`${API_BASE_URL}/api/game-stats?league=${selectedLeague}`);
        const data = await res.json();
        setGameStats(Array.isArray(data) ? data : []);
      } catch {
        setGameStats([]);
      }
    };
    fetchGameStats();
  }, [selectedLeague]);

  // Obtener estadísticas de un partido específico
  const getGameStatsForGame = (gameId) => {
    return gameStats.filter(stat => stat.gameId === gameId);
  };

  // Abrir modal de edición
  const openEditModal = (stat) => {
    setEditingStats(stat);
    setEditForm({
      setsPlayed: String(stat.setsPlayed || ''),
      aces: String(stat.aces || ''),
      assists: String(stat.assists || ''),
      attacks: String(stat.attacks || ''),
      blocks: String(stat.blocks || ''),
      digs: String(stat.digs || ''),
      hittingErrors: String(stat.hittingErrors || ''),
      kills: String(stat.kills || ''),
      points: String(stat.points || '')
    });
    setShowEditModal(true);
  };

  // Guardar cambios
  const handleSaveEdit = async () => {
    if (!editingStats) return;

    const updatedData = {
      gameId: editingStats.gameId,
      playerName: editingStats.playerName,
      team: editingStats.team,
      league: selectedLeague,
      setsPlayed: Number(editForm.setsPlayed),
      aces: Number(editForm.aces) || 0,
      assists: Number(editForm.assists) || 0,
      attacks: Number(editForm.attacks) || 0,
      blocks: Number(editForm.blocks) || 0,
      digs: Number(editForm.digs) || 0,
      hittingErrors: Number(editForm.hittingErrors) || 0,
      kills: Number(editForm.kills) || 0,
      points: Number(editForm.points) || 0
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/game-stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar estadísticas');
      }

      // Recargar datos
      const res = await fetch(`${API_BASE_URL}/api/game-stats?league=${selectedLeague}`);
      const data = await res.json();
      setGameStats(Array.isArray(data) ? data : []);
      
      setShowEditModal(false);
      alert(language === 'en' ? 'Statistics updated successfully!' : '¡Estadísticas actualizadas exitosamente!');
    } catch (error) {
      alert(error.message);
    }
  };

  // Eliminar estadística
  const handleDelete = async (statId) => {
    if (!window.confirm(language === 'en' ? 'Are you sure you want to delete this statistic?' : '¿Estás seguro de que quieres eliminar esta estadística?')) {
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
      const res = await fetch(`${API_BASE_URL}/api/game-stats?league=${selectedLeague}`);
      const data = await res.json();
      setGameStats(Array.isArray(data) ? data : []);
      
      alert(language === 'en' ? 'Statistic deleted successfully!' : '¡Estadística eliminada exitosamente!');
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">{language === 'en' ? 'Game Statistics Management' : 'Gestión de Estadísticas por Partido'}</h2>
      
      {/* Selector de Liga */}
      <div className="mb-4">
        <label className="me-2 fw-bold">{language === 'en' ? 'League:' : 'Liga:'}</label>
        <select
          className="form-select w-auto d-inline"
          value={selectedLeague}
          onChange={e => setSelectedLeague(e.target.value)}
        >
          <option value="">{language === 'en' ? 'Select a league' : 'Selecciona una liga'}</option>
          {leagues.map(league => (
            <option key={league._id} value={league._id}>{league.name}</option>
          ))}
        </select>
      </div>

      {/* Lista de Partidos */}
      {games.length === 0 ? (
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
        <div className="row">
          {games.map(game => {
            const stats = getGameStatsForGame(game._id);
            return (
              <div key={game._id} className="col-12 mb-4">
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      {game.team1} vs {game.team2} - {game.date}
                    </h5>
                    <Badge bg={stats.length > 0 ? 'success' : 'secondary'}>
                      {stats.length} {language === 'en' ? 'player stats' : 'estadísticas de jugadores'}
                    </Badge>
                  </div>
                  <div className="card-body">
                    {stats.length === 0 ? (
                      <p className="text-muted mb-0">
                        {language === 'en' ? 'No statistics recorded for this game.' : 'No hay estadísticas registradas para este partido.'}
                      </p>
                    ) : (
                      <Table striped bordered hover size="sm">
                        <thead>
                          <tr>
                            <th>{language === 'en' ? 'Player' : 'Jugador'}</th>
                            <th>{language === 'en' ? 'Team' : 'Equipo'}</th>
                            <th>{language === 'en' ? 'Sets' : 'Sets'}</th>
                            <th>{language === 'en' ? 'Aces' : 'Aces'}</th>
                            <th>{language === 'en' ? 'Blocks' : 'Bloqueos'}</th>
                            <th>{language === 'en' ? 'Kills' : 'Remates'}</th>
                            <th>{language === 'en' ? 'Points' : 'Puntos'}</th>
                            <th>{language === 'en' ? 'Actions' : 'Acciones'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.map(stat => (
                            <tr key={stat._id}>
                              <td>{stat.playerName}</td>
                              <td>{stat.team}</td>
                              <td>{stat.setsPlayed}</td>
                              <td>{stat.aces}</td>
                              <td>{stat.blocks}</td>
                              <td>{stat.kills}</td>
                              <td>{stat.points}</td>
                              <td>
                                <Button 
                                  size="sm" 
                                  variant="outline-primary" 
                                  className="me-2"
                                  onClick={() => openEditModal(stat)}
                                >
                                  {language === 'en' ? 'Edit' : 'Editar'}
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline-danger"
                                  onClick={() => handleDelete(stat._id)}
                                >
                                  {language === 'en' ? 'Delete' : 'Eliminar'}
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Edición */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {language === 'en' ? 'Edit Statistics' : 'Editar Estadísticas'} - {editingStats?.playerName}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>{language === 'en' ? 'Sets Played' : 'Sets Jugados'}</Form.Label>
              <Form.Control
                type="number"
                min="1"
                value={editForm.setsPlayed}
                onChange={e => setEditForm({...editForm, setsPlayed: e.target.value})}
              />
            </Form.Group>
            
            {['aces', 'assists', 'attacks', 'blocks', 'digs', 'hittingErrors', 'kills', 'points'].map(stat => (
              <Form.Group className="mb-3" key={stat}>
                <Form.Label>
                  {(() => {
                    switch (stat) {
                      case 'aces': return language === 'en' ? 'Aces' : 'Aces';
                      case 'assists': return language === 'en' ? 'Assists' : 'Asistencias';
                      case 'attacks': return language === 'en' ? 'Attacks' : 'Ataques';
                      case 'blocks': return language === 'en' ? 'Blocks' : 'Bloqueos';
                      case 'digs': return language === 'en' ? 'Digs' : 'Defensas';
                      case 'hittingErrors': return language === 'en' ? 'Hitting Errors' : 'Errores de golpeo';
                      case 'kills': return language === 'en' ? 'Kills' : 'Remates';
                      case 'points': return language === 'en' ? 'Points' : 'Puntos';
                      default: return stat;
                    }
                  })()}
                </Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  value={editForm[stat]}
                  onChange={e => setEditForm({...editForm, [stat]: e.target.value})}
                />
              </Form.Group>
            ))}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            {language === 'en' ? 'Cancel' : 'Cancelar'}
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveEdit}
            disabled={!editForm.setsPlayed || Number(editForm.setsPlayed) < 1}
          >
            {language === 'en' ? 'Save Changes' : 'Guardar Cambios'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default GameStatsManagement;
