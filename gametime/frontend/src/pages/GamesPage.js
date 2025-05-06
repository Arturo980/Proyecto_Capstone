import React, { useState, useEffect } from 'react';
import '../styles/UpcomingGames.css'; // Usar los mismos estilos para consistencia
import texts from '../translations/texts'; // Importar traducciones
import gameData from '../data/gameData'; // Importar datos de partidos

const GamesPage = ({ language }) => {
  const [selectedGame, setSelectedGame] = useState(null);

  // Función para formatear fechas al formato dd-mm-aaaa
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses empiezan en 0
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Ordenar los partidos por fecha
  const sortedGames = [...gameData].sort((a, b) => new Date(a.date) - new Date(b.date));

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
        {sortedGames.map((game, index) => (
          <div
            key={index}
            className="game-card"
            onClick={() => setSelectedGame(game)}
          >
            <div className="game-teams">
              <span className="team-left">{game.team1}</span>
              <span className="vs-text">vs</span>
              <span className="team-right">{game.team2}</span>
            </div>
            <div className="game-info">
              <div>{formatDate(game.date)}</div>
              <div>{game.time}</div>
              {game.status === 'past' && <small>Score: {game.score}</small>}
              {game.status === 'ongoing' && <small>{language === 'en' ? 'Live' : 'En Vivo'}</small>}
            </div>
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
            <p>{formatDate(selectedGame.date)}</p>
            <p>{selectedGame.time}</p>
            {selectedGame.status === 'past' && <p>Score: {selectedGame.score}</p>}
            <div>
              <h4>{language === 'en' ? 'Lineup' : 'Citación'}</h4>
              <div className="lineup-container">
                <div className="team-lineup">
                  <h5>{selectedGame.team1}</h5>
                  <ul>
                    {selectedGame.lineup.team1.map((player, index) => (
                      <li key={index}>{player}</li>
                    ))}
                  </ul>
                </div>
                <div className="team-lineup">
                  <h5>{selectedGame.team2}</h5>
                  <ul>
                    {selectedGame.lineup.team2.map((player, index) => (
                      <li key={index}>{player}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamesPage;
