import React from 'react';
import '../styles/PastGames.css'; // Importar estilos

const PastGames = ({ games }) => {
  const sortedGames = [...games].sort((a, b) => {
    const dateTimeA = new Date(`${a.date.split('-').reverse().join('-')}T${a.time}`);
    const dateTimeB = new Date(`${b.date.split('-').reverse().join('-')}T${b.time}`);
    return dateTimeA - dateTimeB;
  });

  return (
    <div className="past-games">
      <ul>
        {sortedGames.map((game, index) => (
          <li key={index} className="game-item">
            <div className="teams-container">
              <strong>
                <span className="team-left">{game.team1}</span>
                <span className="vs-text">vs</span>
                <span className="team-right">{game.team2}</span>
              </strong>
            </div>
            <div>
              <span>{game.date}</span> {/* Use the date directly */}
            </div>
            <div>
              <span className="score-box">{game.status === 'past' || game.status === 'ongoing' ? game.score.split('-')[0] : '-'}</span>
              <span>-</span>
              <span className="score-box">{game.status === 'past' || game.status === 'ongoing' ? game.score.split('-')[1] : '-'}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PastGames;
