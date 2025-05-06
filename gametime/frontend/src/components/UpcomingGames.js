import React from 'react';
import '../styles/UpcomingGames.css'; // Asegurarse de que los estilos estén actualizados
import texts from '../translations/texts'; // Importar traducciones

const UpcomingGames = ({ games, language }) => {

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses empiezan en 0
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return (
    <div className="upcoming-games">
      <div className="games-container">
        {games.map((game, index) => (
          <div key={index} className="game-card">
            <div className="game-teams">
              <span className="team-left">{game.team1}</span>
              <span className="vs-text">{game.vsText}</span>
              <span className="team-right">{game.team2}</span>
            </div>
            <div>
              <span>{formatDate(game.date)} - {game.time}</span>
            </div>
            <div>
              <small>
                {game.team1}: {game.team1Wins}-{game.team1Losses} | {game.team2}: {game.team2Wins}-{game.team2Losses}
              </small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingGames;
