import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/Global.css'; // Importar el CSS global
import Navbar from './components/Navbar';
import ControlledCarousel from './components/ControlledCarousel';
import StandingsTable from './components/StandingsTable';
import Footer from './components/Footer';
import TeamsPage from './pages/TeamsPage';
import StatsPage from './pages/StatsPage';
import UpcomingGames from './components/UpcomingGames';
import GamesPage from './pages/GamesPage'; // Cambiar el nombre del componente
import MediaPage from './pages/MediaPage'; // Importar la nueva página
import texts from './translations/texts';

function App() {
  const [language, setLanguage] = useState('en');

  // Datos de ejemplo para los próximos partidos de voleibol
  const upcomingGames = [
    {
      team1: 'Spikers United',
      team2: 'Block Masters',
      date: '2023-11-01',
      time: '18:00',
      team1Wins: 15,
      team1Losses: 5,
      team2Wins: 12,
      team2Losses: 8,
    },
    {
      team1: 'Ace Warriors',
      team2: 'Net Crushers',
      date: '2023-11-02',
      time: '20:00',
      team1Wins: 18,
      team1Losses: 3,
      team2Wins: 14,
      team2Losses: 6,
    },
  ];

  return (
    <Router>
      <div id="root">
        {/* Navbar */}
        <Navbar language={language} setLanguage={setLanguage} />

        {/* Contenido principal */}
        <div className="main-content">
          <Routes>
            {/* Página Home */}
            <Route
              path="/"
              element={
                <div className="container mt-5">
                  <UpcomingGames games={upcomingGames} />
                  <div className="row mt-5">
                    <div className="col-md-8">
                      <ControlledCarousel language={language} />
                    </div>
                    <div className="col-md-4">
                      <h3>{texts[language].standings_title}</h3>
                      <StandingsTable />
                    </div>
                  </div>
                </div>
              }
            />
            {/* Página de Equipos */}
            <Route path="/teams" element={<TeamsPage language={language} />} />
            {/* Página de Estadísticas */}
            <Route path="/stats" element={<StatsPage language={language} />} />
            {/* Página de Partidos */}
            <Route path="/games" element={<GamesPage language={language} />} />
            {/* Página de Media */}
            <Route path="/media" element={<MediaPage language={language} />} />
          </Routes>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </Router>
  );
}

export default App;
