import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import gameData from '../data/gameData';
import '../styles/MatchList.css';

const MatchList = () => {
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [modalStep, setModalStep] = useState('options'); // Controla qué mostrar en el modal
    const [team1Score, setTeam1Score] = useState(0);
    const [team2Score, setTeam2Score] = useState(0);
    const [team1Sets, setTeam1Sets] = useState(0); // Sets won by team 1
    const [team2Sets, setTeam2Sets] = useState(0); // Sets won by team 2
    const [showDeleteButtons, setShowDeleteButtons] = useState(false); // Controla si se muestran los botones de eliminar
    const [showAddPlayerModal, setShowAddPlayerModal] = useState(false); // Controla si se muestra el modal de agregar jugador
    const [newPlayerName, setNewPlayerName] = useState(''); // Nombre del nuevo jugador
    const [selectedTeam, setSelectedTeam] = useState(null); // Controla el equipo seleccionado en el modal de agregar jugador
    const [selectedPlayers, setSelectedPlayers] = useState({ team1: [], team2: [] }); // Controla los jugadores seleccionados para eliminar
    const [totalSets, setTotalSets] = useState(3); // Total sets in the match (3 or 5)
    const [lastSetPointLimit, setLastSetPointLimit] = useState(15); // Point limit for the last set (15 or 25)
    const [matchEnded, setMatchEnded] = useState(false); // Controla si el partido ha terminado
    const [winningTeam, setWinningTeam] = useState(null); // Almacena el equipo ganador
    const navigate = useNavigate();

    const handleBack = () => {
        navigate('/match-manager'); // Regresar a la página del manager
    };

    const handleOpenModal = (match) => {
        setSelectedMatch(match);
        setModalStep('options');
        setTeam1Score(match.score ? parseInt(match.score.split('-')[0]) : 0);
        setTeam2Score(match.score ? parseInt(match.score.split('-')[1]) : 0);
    };

    const handleCloseModal = () => {
        setSelectedMatch(null);
        setModalStep('options');
        setShowDeleteButtons(false);
    };

    const handleOpenAddPlayerModal = () => {
        setNewPlayerName('');
        setSelectedTeam(null); // Reiniciar el equipo seleccionado
        setShowAddPlayerModal(true);
    };

    const handleSelectTeam = (team) => {
        setSelectedTeam(team); // Establecer el equipo seleccionado
    };

    const handleAddPlayerToSelectedTeam = () => {
        if (!newPlayerName) {
            alert("Player name cannot be empty.");
            return;
        }
        if (selectedMatch.lineup[selectedTeam].length < 14) {
            setSelectedMatch({
                ...selectedMatch,
                lineup: {
                    ...selectedMatch.lineup,
                    [selectedTeam]: [...selectedMatch.lineup[selectedTeam], newPlayerName],
                },
            });
            setShowAddPlayerModal(false);
        } else {
            alert("Maximum players reached for this team.");
        }
    };

    const handleRemovePlayer = (team, index) => {
        if (selectedMatch.lineup[team].length > 7) {
            const updatedTeam = selectedMatch.lineup[team].filter((_, i) => i !== index);
            setSelectedMatch({
                ...selectedMatch,
                lineup: {
                    ...selectedMatch.lineup,
                    [team]: updatedTeam,
                },
            });
        }
    };

    const handleScoreChange = (team, increment) => {
        if (team === 'team1') {
            setTeam1Score(Math.max(0, team1Score + increment)); // Prevent negative scores
        } else {
            setTeam2Score(Math.max(0, team2Score + increment)); // Prevent negative scores
        }
    };

    const handleConfirmSet = () => {
        const isLastSet = team1Sets + team2Sets + 1 === totalSets; // Check if it's the last set
        const pointLimit = isLastSet ? lastSetPointLimit : 25; // Use the last set point limit if applicable

        if (
            (team1Score >= pointLimit || team2Score >= pointLimit) && // Ensure at least the point limit
            Math.abs(team1Score - team2Score) >= 2 && // Ensure a 2-point difference
            team1Sets + team2Sets < totalSets // Ensure total sets do not exceed the configured limit
        ) {
            if (team1Score > team2Score) {
                setTeam1Sets(team1Sets + 1);
                if (team1Sets + 1 === Math.ceil(totalSets / 2)) {
                    setMatchEnded(true);
                    setWinningTeam('team1');
                    saveMatchResult('team1'); // Save the match result when the match ends
                }
            } else {
                setTeam2Sets(team2Sets + 1);
                if (team2Sets + 1 === Math.ceil(totalSets / 2)) {
                    setMatchEnded(true);
                    setWinningTeam('team2');
                    saveMatchResult('team2'); // Save the match result when the match ends
                }
            }
            setTeam1Score(0);
            setTeam2Score(0);
        } else {
            alert(`Set cannot be confirmed. Ensure a team has at least ${pointLimit} points, a 2-point lead, and the total sets do not exceed ${totalSets}.`);
        }
    };

    const saveMatchResult = (winner) => {
        const matchIndex = gameData.findIndex((match) => match === selectedMatch);

        if (matchIndex !== -1) {
            const updatedMatch = {
                ...gameData[matchIndex],
                status: 'past', // Cambiar el estado a "pasado"
                score: `${team1Sets}-${team2Sets}`, // Reflejar la cantidad de sets ganados por cada equipo
                results: {
                    winner: winner === 'team1' ? gameData[matchIndex].team1 : gameData[matchIndex].team2,
                    sets: {
                        team1: team1Sets,
                        team2: team2Sets,
                    },
                },
            };

            // Actualizar el objeto gameData con los resultados finales
            gameData[matchIndex] = updatedMatch;

            console.log('Resultados finales del partido:', JSON.stringify(updatedMatch, null, 2)); // Registrar los resultados finales
            console.log(`El ganador del partido es: ${updatedMatch.results.winner}`); // Mostrar el ganador del partido

            // Cerrar el modal y reiniciar el estado
            setSelectedMatch(null);
            setModalStep('options');
            setMatchEnded(true); // Asegurar que el estado del partido esté marcado como terminado
        } else {
            console.error('Partido no encontrado en gameData.');
        }
    };

    const handleSaveMatchSettings = () => {
        const sets = parseInt(document.getElementById('total-sets-input').value, 10);
        const points = parseInt(document.getElementById('last-set-points-input').value, 10);

        if (sets !== 3 && sets !== 5) {
            alert("Invalid input. Please enter 3 or 5 for total sets.");
            return;
        }
        if (points !== 15 && points !== 25) {
            alert("Invalid input. Please enter 15 or 25 for last set points.");
            return;
        }

        setTotalSets(sets);
        setLastSetPointLimit(points);
        setModalStep('options');
    };

    const handleTogglePlayerSelection = (team, index) => {
        const isSelected = selectedPlayers[team].includes(index);
        const updatedSelection = isSelected
            ? selectedPlayers[team].filter((i) => i !== index)
            : [...selectedPlayers[team], index];
        setSelectedPlayers({ ...selectedPlayers, [team]: updatedSelection });
    };

    const handleConfirmDelete = () => {
        const updatedTeam1 = selectedMatch.lineup.team1.filter(
            (_, index) => !selectedPlayers.team1.includes(index)
        );
        const updatedTeam2 = selectedMatch.lineup.team2.filter(
            (_, index) => !selectedPlayers.team2.includes(index)
        );

        setSelectedMatch({
            ...selectedMatch,
            lineup: {
                team1: updatedTeam1,
                team2: updatedTeam2,
            },
        });

        setSelectedPlayers({ team1: [], team2: [] }); // Reiniciar la selección
        setShowDeleteButtons(false); // Ocultar el modo de eliminación
    };

    useEffect(() => {
        if (selectedMatch || showAddPlayerModal) {
            document.body.style.overflow = 'hidden'; // Disable scrolling on the main page
        } else {
            document.body.style.overflow = 'auto'; // Enable scrolling when no modal is open
        }
        return () => {
            document.body.style.overflow = 'auto'; // Cleanup on component unmount
        };
    }, [selectedMatch, showAddPlayerModal]);

    return (
        <div className="match-list-container">
            <h1>Available Matches</h1>
            <button onClick={handleBack} className="back-button">Back to Manager</button>
            <div className="match-list">
                {gameData.map((match, index) => (
                    <div key={index} className="match-card" onClick={() => handleOpenModal(match)}>
                        <h2>{match.team1} vs {match.team2}</h2>
                        <p><strong>Date:</strong> {match.date}</p>
                        <p><strong>Time:</strong> {match.time}</p>
                        <p><strong>Status:</strong> {match.status}</p>
                        {match.status === 'past' && (
                            <>
                                <p><strong>Score:</strong> {match.score}</p>
                                <p><strong>Winner:</strong> {match.results?.winner || 'N/A'}</p>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {selectedMatch && (
                <div className="modal">
                    <div className="modal-content">
                        {modalStep === 'options' && (
                            <span className="close-button" onClick={handleCloseModal}>&times;</span>
                        )}
                        {modalStep === 'options' && (
                            <div>
                                <h2>¿Qué quieres editar?</h2>
                                <button onClick={() => setModalStep('players')} className="modal-option-button">
                                    Ver jugadores citados
                                </button>
                                <button onClick={() => setModalStep('score')} className="modal-option-button">
                                    Marcador en vivo
                                </button>
                                <button onClick={() => setModalStep('settings')} className="modal-option-button">
                                    Configuración del partido
                                </button>
                            </div>
                        )}
                        {modalStep === 'players' && (
                            <div>
                                <div className="modal-teams">
                                    <div className="team-column">
                                        <h3>{selectedMatch.team1}</h3>
                                        <ul>
                                            {selectedMatch.lineup.team1.map((player, index) => (
                                                <li key={index}>
                                                    {showDeleteButtons ? (
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedPlayers.team1.includes(index)}
                                                                onChange={() => handleTogglePlayerSelection('team1', index)}
                                                            />
                                                            {player}
                                                        </label>
                                                    ) : (
                                                        <span>{player}</span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="team-column">
                                        <h3>{selectedMatch.team2}</h3>
                                        <ul>
                                            {selectedMatch.lineup.team2.map((player, index) => (
                                                <li key={index}>
                                                    {showDeleteButtons ? (
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedPlayers.team2.includes(index)}
                                                                onChange={() => handleTogglePlayerSelection('team2', index)}
                                                            />
                                                            {player}
                                                        </label>
                                                    ) : (
                                                        <span>{player}</span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                                <div className="team-actions">
                                    <button onClick={() => setShowDeleteButtons(!showDeleteButtons)}>
                                        {showDeleteButtons ? 'Cancel' : 'Eliminar jugadores'}
                                    </button>
                                    {showDeleteButtons && (
                                        <button onClick={handleConfirmDelete} className="confirm-delete-button">
                                            Confirmar eliminación
                                        </button>
                                    )}
                                    <button onClick={handleOpenAddPlayerModal}>Añadir Jugador</button>
                                </div>
                                <button onClick={() => setModalStep('options')} className="back-button">Volver</button>
                            </div>
                        )}
                        {modalStep === 'score' && (
                            <div>
                                <h3>Marcador en vivo</h3>
                                <div className="score-container">
                                    {matchEnded ? (
                                        <>
                                            <div className="team-score">
                                                <p>
                                                    <strong>{selectedMatch.team1}</strong>
                                                    <span className="set-score">Sets: {team1Sets}</span>
                                                </p>
                                            </div>
                                            <div className="team-score">
                                                <p>
                                                    <strong>{selectedMatch.team2}</strong>
                                                    <span className="set-score">Sets: {team2Sets}</span>
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className={`team-score ${winningTeam === 'team1' ? 'winner' : ''}`}>
                                                <p>
                                                    <strong>{selectedMatch.team1}</strong>
                                                    <span className="set-score">Sets: {team1Sets}</span>
                                                </p>
                                                <p className="current-score">{team1Score}</p>
                                                <div className="score-buttons">
                                                    <button onClick={() => handleScoreChange('team1', -1)}>-1</button>
                                                    <button onClick={() => handleScoreChange('team1', 1)}>+1</button>
                                                </div>
                                            </div>
                                            <div className={`team-score ${winningTeam === 'team2' ? 'winner' : ''}`}>
                                                <p>
                                                    <strong>{selectedMatch.team2}</strong>
                                                    <span className="set-score">Sets: {team2Sets}</span>
                                                </p>
                                                <p className="current-score">{team2Score}</p>
                                                <div className="score-buttons">
                                                    <button onClick={() => handleScoreChange('team2', -1)}>-1</button>
                                                    <button onClick={() => handleScoreChange('team2', 1)}>+1</button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                                {!matchEnded && (
                                    <button onClick={handleConfirmSet} className="confirm-set-button">
                                        Confirmar Set
                                    </button>
                                )}
                                <button onClick={() => setModalStep('options')} className="back-button">Volver</button>
                            </div>
                        )}
                        {modalStep === 'settings' && (
                            <div>
                                <h2>Configuración del partido</h2>
                                <div className="modal-field">
                                    <label htmlFor="total-sets-input">Total Sets (3 or 5):</label>
                                    <input id="total-sets-input" type="number" min="3" max="5" step="2" defaultValue={totalSets} />
                                </div>
                                <div className="modal-field">
                                    <label htmlFor="last-set-points-input">Last Set Points (15 or 25):</label>
                                    <input id="last-set-points-input" type="number" min="15" max="25" step="10" defaultValue={lastSetPointLimit} />
                                </div>
                                <button onClick={handleSaveMatchSettings} className="save-button">Guardar configuración</button>
                                <button onClick={() => setModalStep('options')} className="back-button">Volver</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showAddPlayerModal && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close-button" onClick={() => setShowAddPlayerModal(false)}>&times;</span>
                        {!selectedTeam ? (
                            <div>
                                <h2>Select a Team</h2>
                                <div className="team-actions">
                                    <button onClick={() => handleSelectTeam('team1')}>{selectedMatch.team1}</button>
                                    <button onClick={() => handleSelectTeam('team2')}>{selectedMatch.team2}</button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <h2>Add Player to {selectedMatch[selectedTeam]}</h2>
                                <input
                                    type="text"
                                    placeholder="Enter player's name"
                                    value={newPlayerName}
                                    onChange={(e) => setNewPlayerName(e.target.value)}
                                />
                                <button onClick={handleAddPlayerToSelectedTeam} className="save-button">Add Player</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MatchList;
