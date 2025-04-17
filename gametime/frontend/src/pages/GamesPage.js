import React, { useState, useEffect } from 'react';
import '../styles/UpcomingGames.css'; // Usar los mismos estilos para consistencia
import texts from '../translations/texts'; // Importar traducciones

const GamesPage = ({ language }) => {
  const [selectedGame, setSelectedGame] = useState(null);

  // Datos de ejemplo para los partidos
  const games = [
    {
      team1: 'Spikers United',
      team2: 'Block Masters',
      date: '2023-11-01',
      time: '18:00',
      team1Stats: { wins: 15, losses: 5, players: ['Player A', 'Player B', 'Player C'] },
      team2Stats: { wins: 12, losses: 8, players: ['Player X', 'Player Y', 'Player Z'] },
    },
    {
      team1: 'Ace Warriors',
      team2: 'Net Crushers',
      date: '2023-11-02',
      time: '20:00',
      team1Stats: { wins: 18, losses: 3, players: ['Player D', 'Player E', 'Player F'] },
      team2Stats: { wins: 14, losses: 6, players: ['Player U', 'Player V', 'Player W'] },
    },
  ];

  // Función para formatear fechas al formato dd-mm-aaaa
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses empiezan en 0
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Deshabilitar el desplazamiento de la página principal cuando el modal está abierto
  useEffect(() => {
    if (selectedGame) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto'; // Restaurar el desplazamiento al desmontar
    };
  }, [selectedGame]);

  return (
    <div className="container mt-5">
      <h2>{texts[language]?.navbar_games || 'Games'}</h2>
      <div className="games-container">
        {games.map((game, index) => (
          <div
            key={index}
            className="game-card"
            onClick={() => setSelectedGame(game)}
          >
            <strong>{game.team1} vs {game.team2}</strong>
            <span>{formatDate(game.date)} - {game.time}</span>
          </div>
        ))}
      </div>

      {selectedGame && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target.classList.contains('modal-overlay')) {
              setSelectedGame(null); // Cerrar el modal al hacer clic fuera de él
            }
          }}
        >
          <div className="modal-content">
            <button
              className="btn btn-secondary close-button"
              onClick={() => setSelectedGame(null)}
            >
              &times; {/* Mostrar solo una "X" */}
            </button>
            <h3>{selectedGame.team1} vs {selectedGame.team2}</h3>
            <p>{formatDate(selectedGame.date)} - {selectedGame.time}</p>
            <div className="row">
              <div className="col-md-6">
                <h4>{selectedGame.team1}</h4>
                <p>{selectedGame.team1Stats.wins}-{selectedGame.team1Stats.losses}</p>
                <h5>{language === 'en' ? 'Players:' : 'Jugadores:'}</h5>
                <ul>
                  {selectedGame.team1Stats.players.map((player, idx) => (
                    <li key={idx}>{player}</li>
                  ))}
                </ul>
              </div>
              <div className="col-md-6">
                <h4>{selectedGame.team2}</h4>
                <p>{selectedGame.team2Stats.wins}-{selectedGame.team2Stats.losses}</p>
                <h5>{language === 'en' ? 'Players:' : 'Jugadores:'}</h5>
                <ul>
                  {selectedGame.team2Stats.players.map((player, idx) => (
                    <li key={idx}>{player}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamesPage;
