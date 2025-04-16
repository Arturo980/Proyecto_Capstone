import React from 'react';
import '../styles/UpcomingGames.css'; // Asegurarse de que los estilos estén actualizados

const UpcomingGames = ({ games }) => {
  return (
    <div className="upcoming-games">
      <h3>Upcoming Games</h3>
      <div className="games-container">
        {games.map((game, index) => (
          <div key={index} className="game-card">
            <div>
              <strong>{game.team1} vs {game.team2}</strong>
            </div>
            <div>
              <span>{game.date} - {game.time}</span>
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
