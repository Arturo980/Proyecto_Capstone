import React, { useState } from 'react';
import teamsData from '../data/teamsData'; // Datos de los equipos

const TeamsPage = ({ language }) => {
  const [selectedTeam, setSelectedTeam] = useState(null); // Estado para el equipo seleccionado

  const handleTeamClick = (team) => {
    setSelectedTeam(team); // Establecer el equipo seleccionado
  };

  return (
    <div className="container mt-5">
      {!selectedTeam ? (
        <div>
          <h2>{language === 'en' ? 'Teams' : 'Equipos'}</h2>
          <div className="row">
            {teamsData.map((team) => (
              <div
                key={team.id}
                className="col-md-4 mb-3"
                onClick={() => handleTeamClick(team)}
                style={{ cursor: 'pointer' }}
              >
                <div className="card">
                  <img src={team.logo} className="card-img-top" alt={team.name} />
                  <div className="card-body">
                    <h5 className="card-title">{team.name}</h5>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <button className="btn btn-secondary mb-3" onClick={() => setSelectedTeam(null)}>
            {language === 'en' ? 'Back to Teams' : 'Volver a Equipos'}
          </button>
          <h2>{selectedTeam.name}</h2>
          <h3>{language === 'en' ? 'Roster' : 'Plantilla'}</h3>
          <div>
            <h4>{language === 'en' ? 'Staff' : 'Cuerpo Técnico'}</h4>
            <ul>
              {selectedTeam.staff.map((member, index) => (
                <li key={index}>{member}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4>{language === 'en' ? 'Players' : 'Jugadores'}</h4>
            <ul>
              {selectedTeam.players.map((player, index) => (
                <li key={index}>{player}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsPage;
