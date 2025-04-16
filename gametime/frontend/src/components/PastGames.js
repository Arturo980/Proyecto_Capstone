import React from 'react';
import '../styles/PastGames.css'; // Importar estilos

const PastGames = ({ games }) => {
  return (
    <div className="past-games">
      <ul>
        {games.map((game, index) => (
          <li key={index} className="game-item">
            <div>
              <strong>{game.team1} vs {game.team2}</strong>
            </div>
            <div>
              <span>{game.date}</span>
            </div>
            <div>
              <small>Score: {game.score}</small>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PastGames;
