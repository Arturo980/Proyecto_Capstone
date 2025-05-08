import React, { useState } from 'react';
import Calendar from 'react-calendar'; // Importar el componente de calendario
import 'react-calendar/dist/Calendar.css'; // Importar estilos del calendario
import '../styles/GamePage.css';
import gameData from '../data/gameData';
import es from 'date-fns/locale/es'; // Importar el idioma español de date-fns
import calendar from '../assets/images/calendario.png'; // Importar la imagen del calendario

const GamesPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date()); // Estado para la fecha seleccionada
  const [showModal, setShowModal] = useState(false); // Estado para mostrar/ocultar el modal

  // Obtener las fechas de los partidos
  const matchDates = gameData.map((game) => {
    const [day, month, year] = game.date.split('-');
    return new Date(`${year}-${month}-${day}`).toDateString();
  });

  // Obtener los días del mes actual
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Manejar la selección de una fecha
  const handleDateChange = (date) => {
    setSelectedDate(date); // Actualizar la fecha seleccionada
    setShowModal(false); // Cerrar el modal
  };

  const handleDayClick = (day) => {
    const newDate = new Date(currentYear, currentMonth, day);
    setSelectedDate(newDate);
  };

  // Filtrar los partidos según la fecha seleccionada
  const filteredGames = gameData.filter((game) => {
    const gameDate = new Date(game.date.split('-').reverse().join('-'));
    return gameDate.toDateString() === selectedDate.toDateString();
  });

  return (
    <div className="page-container">
      <div className="calendar-header">
        <h3>{selectedDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}</h3>
      </div>
      <div className="scoreboardDateNav">
        <div className="date-nav-scroll">
          {[...Array(daysInMonth)].map((_, index) => {
            const day = index + 1;
            const dateString = new Date(currentYear, currentMonth, day).toDateString();
            const isMatchDay = matchDates.includes(dateString);

            return (
              <div
                key={day}
                className={`date-nav-day ${isMatchDay ? 'highlight-date' : 'disabled-date'} ${
                  selectedDate.getDate() === day ? 'selected-day' : ''
                }`}
                onClick={() => handleDayClick(day)}
              >
                {day}
              </div>
            );
          })}
        </div>
        <div className="calendar-container">
          <button
            className="calendar-icon"
            onClick={() => setShowModal(true)} // Abrir el modal al hacer clic
          >
            <img src={calendar} alt="Abrir calendario" />
          </button>
        </div>
      </div>
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <Calendar
              onChange={handleDateChange} // Manejar la selección de fecha
              value={selectedDate} // Fecha seleccionada
              locale={es} // Configurar idioma en español
              tileClassName={({ date }) => {
                const dateString = date.toDateString();
                if (matchDates.includes(dateString)) {
                  return 'highlight-date'; // Clase para días con partidos
                }
                return 'disabled-date'; // Clase para días sin partidos
              }}
            />
            <button className="close-modal" onClick={() => setShowModal(false)}>
              X
            </button>
          </div>
        </div>
      )}
      <div className="games-container">
        {filteredGames.length > 0 ? (
          filteredGames.map((game, index) => (
            <div key={index} className="game-box">
              <div className="team-names-container">
                <div className="team-name">{game.team1}</div>
                <div className="vs-text">vs</div>
                <div className="team-name">{game.team2}</div>
              </div>
              <div className="date-time">
                {game.date} - {game.time}
              </div>
              <div className="score-box-container">
                <div className="score-box">
                  {game.status === 'past' || game.status === 'ongoing' ? game.score.split('-')[0] : '-'}
                </div>
                <div className="score-box">
                  {game.status === 'past' || game.status === 'ongoing' ? game.score.split('-')[1] : '-'}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No hay partidos programados para esta fecha.</p>
        )}
      </div>
    </div>
  );
};

export default GamesPage;
