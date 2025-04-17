import React, { useState, useEffect } from 'react';
import teamsData from '../data/teamsData'; // Datos de los equipos
import '../styles/MediaPage.css'; // Reutilizar estilos globales

const TeamsPage = ({ language }) => {
  const [selectedTeam, setSelectedTeam] = useState(null); // Estado para el equipo seleccionado

  const handleTeamClick = (team) => {
    setSelectedTeam(team); // Establecer el equipo seleccionado
  };

  const handleCloseModal = () => {
    setSelectedTeam(null); // Cerrar el modal
  };

  // Deshabilitar el desplazamiento de la página principal cuando el modal está abierto
  useEffect(() => {
    if (selectedTeam) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto'; // Restaurar el desplazamiento al desmontar
    };
  }, [selectedTeam]);

  return (
    <div className="container mt-5">
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

      {selectedTeam && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target.classList.contains('modal-overlay')) {
              handleCloseModal(); // Cerrar el modal al hacer clic fuera de él
            }
          }}
        >
          <div className="modal-content">
            <button
              className="btn btn-secondary close-button"
              onClick={handleCloseModal}
            >
              &times; {/* Mostrar solo una "X" */}
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
        </div>
      )}
    </div>
  );
};

export default TeamsPage;
