import React from 'react';
import '../styles/UpcomingGames.css'; // Usar los mismos estilos para consistencia
import texts from '../translations/texts'; // Importar traducciones

const UpcomingGamesPage = ({ language }) => {
  // Datos de ejemplo para los partidos jugados
  const pastGames = [
    {
      team1: 'Team E',
      team2: 'Team F',
      date: '2023-10-28',
      time: '18:00',
      score: '89-76',
    },
    {
      team1: 'Team G',
      team2: 'Team H',
      date: '2023-10-27',
      time: '20:00',
      score: '102-98',
    },
  ];

  // Datos de ejemplo para los próximos partidos
  const upcomingGames = [
    {
      team1: 'Team A',
      team2: 'Team B',
      date: '2023-11-01',
      time: '18:00',
      team1Wins: 10,
      team1Losses: 5,
      team2Wins: 8,
      team2Losses: 7,
    },
    {
      team1: 'Team C',
      team2: 'Team D',
      date: '2023-11-02',
      time: '20:00',
      team1Wins: 12,
      team1Losses: 3,
      team2Wins: 9,
      team2Losses: 6,
    },
  ];

  // Combinar y ordenar los partidos por fecha
  const allGames = [
    ...pastGames.map((game) => ({ ...game, isPast: true })), // Marcar partidos jugados
    ...upcomingGames.map((game) => ({ ...game, isPast: false })), // Marcar próximos partidos
  ].sort((a, b) => new Date(a.date) - new Date(b.date)); // Ordenar por fecha

  return (
    <div className="container mt-5">
      <h2>{texts[language]?.navbar_upcoming_games || 'Games'}</h2>
      <div className="games-container">
        {allGames.map((game, index) => (
          <div key={index} className="game-card">
            <div>
              <strong>{game.team1} vs {game.team2}</strong>
            </div>
            <div>
              <span>{game.date} - {game.time}</span>
            </div>
            {game.isPast ? (
              <div>
                <small>Score: {game.score}</small>
              </div>
            ) : (
              <div>
                <small>
                  {game.team1}: {game.team1Wins}-{game.team1Losses} | {game.team2}: {game.team2Wins}-{game.team2Losses}
                </small>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingGamesPage;
