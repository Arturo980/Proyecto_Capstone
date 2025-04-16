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
import UpcomingGamesPage from './pages/UpcomingGamesPage';
import texts from './translations/texts';

function App() {
  const [language, setLanguage] = useState('en');

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
            {/* Página de Próximos Partidos */}
            <Route path="/upcoming-games" element={<UpcomingGamesPage language={language} />} />
          </Routes>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </Router>
  );
}

export default App;
