import React, { useState } from 'react';
import '../styles/UpcomingGames.css'; // Mantener los estilos para la página de partidos

const UpcomingGames = ({ games, language }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);

  const openModal = (game) => {
    setSelectedGame(game);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedGame(null);
  };

  const sortedGames = [...games].sort((a, b) => {
    const dateTimeA = new Date(`${a.date.split('-').reverse().join('-')}T${a.time}`);
    const dateTimeB = new Date(`${b.date.split('-').reverse().join('-')}T${b.time}`);
    return dateTimeA - dateTimeB;
  });

  const formatDate = (dateString) => {
    return dateString; // Return the date as it is already in dd-mm-yyyy format
  };

  return (
    <div className="upcoming-games">
      <div className="games-container">
        {sortedGames.map((game, index) => (
          <div key={index} className="game-card" onClick={() => openModal(game)}>
            <div className="game-teams">
              <span className="team-left" style={{ textAlign: 'left' }}>{game.team1}</span>
              <span className="vs-text">{game.vsText}</span>
              <span className="team-right" style={{ textAlign: 'right' }}>{game.team2}</span>
            </div>
            <div className="game-info">
              <div>{formatDate(game.date)} - {game.time}</div>
              <div>
                <span className="score-box">{game.status === 'past' || game.status === 'ongoing' ? game.score.split('-')[0] : '-'}</span>
                <span>-</span>
                <span className="score-box">{game.status === 'past' || game.status === 'ongoing' ? game.score.split('-')[1] : '-'}</span>
              </div>
              {game.status === 'ongoing' && (
                <small>{language === 'en' ? 'Live' : 'En Vivo'}</small>
              )}
            </div>
            <div>
              <small>
                {game.team1}: {game.team1Wins}-{game.team1Losses} | {game.team2}: {game.team2Wins}-{game.team2Losses}
              </small>
            </div>
          </div>
        ))}
      </div>
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Modal content goes here */}
          </div>
        </div>
      )}
    </div>
  );
};

export default UpcomingGames;
