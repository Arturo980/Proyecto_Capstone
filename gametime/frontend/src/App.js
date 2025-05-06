import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom'; // Import Link
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
import gameData from './data/gameData'; // Importar datos de partidos

function App() {
  const [language, setLanguage] = useState('en');

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
                  <div className="mb-4">
                    <h3>{texts[language]?.upcoming_games || 'Upcoming Games'}</h3>
                    <UpcomingGames
                      games={gameData.map((game) => ({
                        ...game,
                        vsText: 'vs', // Ensure "vs" remains consistent
                      }))}
                      language={language}
                    />
                  </div>
                  <div className="row mt-5">
                    <div className="col-md-8">
                      <ControlledCarousel language={language} />
                    </div>
                    <div className="col-md-4">
                      <h3>{texts[language].standings_title}</h3>
                      <StandingsTable language={language} /> {/* Pasar el idioma */}
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
        <Footer language={language} />
      </div>
    </Router>
  );
}

export default App;
