import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'; // Importar Router
import 'bootstrap/dist/css/bootstrap.min.css';
import Navbar from './components/Navbar';
import ControlledCarousel from './components/ControlledCarousel';
import StandingsTable from './components/StandingsTable';
import Footer from './components/Footer';
import TeamsPage from './pages/TeamsPage'; // Importar la nueva página de equipos
import StatsPage from './pages/StatsPage'; // Importar la nueva página de estadísticas
import texts from './translations/texts';
import './styles/Footer.css';

function App() {
  const [language, setLanguage] = useState('en');

  return (
    <Router>
      <div>
        {/* Navbar */}
        <Navbar language={language} setLanguage={setLanguage} />

        {/* Rutas */}
        <Routes>
          {/* Página Home */}
          <Route
            path="/"
            element={
              <div className="container mt-5">
                <div className="row">
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
        </Routes>

        {/* Footer */}
        <Footer />
      </div>
    </Router>
  );
}

export default App;
