import React, { useEffect, useState } from 'react';
import Table from 'react-bootstrap/Table';

const StandingsTable = ({ teams = [], games = [], leagueConfig = {} }) => {
  // Calcula la tabla de posiciones
  const [standings, setStandings] = useState([]);

  useEffect(() => {
    // Inicializa stats por equipo
    const stats = {};
    teams.forEach((team) => {
      stats[team.name] = {
        team: team.name,
        played: 0,
        won: 0,
        lost: 0,
        setsWon: 0,
        setsLost: 0,
        points: 0,
      };
    });

    // Recorre partidos terminados
    games
      .filter((g) => g.partidoFinalizado)
      .forEach((game) => {
        const t1 = stats[game.team1];
        const t2 = stats[game.team2];
        if (!t1 || !t2) return;
        t1.played += 1;
        t2.played += 1;
        // Sets
        const sets1 = game.sets1 ?? 0;
        const sets2 = game.sets2 ?? 0;
        t1.setsWon += sets1;
        t1.setsLost += sets2;
        t2.setsWon += sets2;
        t2.setsLost += sets1;
        // Ganador
        if (sets1 > sets2) {
          t1.won += 1;
          t2.lost += 1;
          t1.points += leagueConfig.pointsWin ?? 3;
          t2.points += leagueConfig.pointsLose ?? 0;
        } else if (sets2 > sets1) {
          t2.won += 1;
          t1.lost += 1;
          t2.points += leagueConfig.pointsWin ?? 3;
          t1.points += leagueConfig.pointsLose ?? 0;
        }
      });

    // Ordena por puntos, luego sets ganados - sets perdidos
    const arr = Object.values(stats).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const diffA = a.setsWon - a.setsLost;
      const diffB = b.setsWon - b.setsLost;
      return diffB - diffA;
    });
    setStandings(arr);
  }, [teams, games, leagueConfig]);

  return (
    <Table striped bordered hover size="sm">
      <thead>
        <tr>
          <th>Equipo</th>
          <th>J</th>
          <th>G</th>
          <th>P</th>
          <th>Sets G</th>
          <th>Sets P</th>
          <th>Puntos</th>
        </tr>
      </thead>
      <tbody>
        {standings.map((team) => (
          <tr key={team.team}>
            <td>{team.team}</td>
            <td>{team.played}</td>
            <td>{team.won}</td>
            <td>{team.lost}</td>
            <td>{team.setsWon}</td>
            <td>{team.setsLost}</td>
            <td>{team.points}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default StandingsTable;
