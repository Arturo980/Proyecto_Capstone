import React from 'react';
import Table from 'react-bootstrap/Table';

const StandingsTable = () => {
  const standings = [
    { position: 1, team: 'Equipo A', points: 30 },
    { position: 2, team: 'Equipo B', points: 25 },
    { position: 3, team: 'Equipo C', points: 20 },
  ];

  return (
    <Table striped bordered hover size="sm">
      <thead>
        <tr>
          <th>#</th>
          <th>Equipo</th>
          <th>Puntos</th>
        </tr>
      </thead>
      <tbody>
        {standings.map((team) => (
          <tr key={team.position}>
            <td>{team.position}</td>
            <td>{team.team}</td>
            <td>{team.points}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default StandingsTable;
