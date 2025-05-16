import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'; // Import Link eliminado
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/Global.css'; // Importar el CSS global
import Navbar from './components/Navbar';
import ControlledCarousel from './components/ControlledCarousel';
import StandingsTable from './components/StandingsTable';
import Footer from './components/Footer';
import TeamsPage from './pages/TeamsPage';
import StatsPage from './pages/StatsPage';
import GamesPage from './pages/GamesPage'; // Cambiar el nombre del componente
import MediaPage from './pages/MediaPage'; // Importar la nueva página
import Login from './pages/Login'; // Importar la página de Login
import Register from './pages/Register'; // Importar la página de Registro
import AdminSolicitudes from './pages/AdminSolicitudes'; // Importar la página de Solicitudes de Admin
import AdminAuditPage from './pages/AdminAuditPage';
import texts from './translations/texts';
import HorizontalGamesCarousel from './components/HorizontalGamesCarousel'; // Importar el nuevo componente

function App() {
  const [language, setLanguage] = useState('en');
  const [isNavbarHidden, setIsNavbarHidden] = useState(false);
  // Inicializa isLoggedIn según si hay usuario en localStorage
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      return !!localStorage.getItem('user');
    } catch {
      return false;
    }
  });
  // NUEVO: Obtener el rol del usuario (soporta content-editor)
  const [userRole] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      // El backend retorna tipoCuenta, no role
      if (user?.esAdmin) return 'admin';
      return user?.tipoCuenta || 'public';
    } catch {
      return 'public';
    }
  });

  useEffect(() => {
    // Asegura que el tema claro esté aplicado por defecto
    if (!document.body.className) {
      document.body.className = 'theme-light';
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const carousel = document.querySelector('.horizontal-carousel-wrapper');
      if (carousel && carousel.contains(e.target)) {
        setIsNavbarHidden(false); // Mostrar la barra si el mouse está sobre el carrusel
      } else {
        setIsNavbarHidden(true); // Ocultar la barra si el mouse no está sobre el carrusel
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <Router>
      <Routes>
        {/* Página de Login */}
        <Route
          path="/login"
          element={<Login setIsLoggedIn={setIsLoggedIn} />}
        />
        {/* Página de Registro */}
        <Route
          path="/register"
          element={<Register />}
        />
        {/* Rutas principales */}
        <Route
          path="*"
          element={
            <div id="root" style={{ overflowX: 'hidden' }}>
              {/* Navbar */}
              <Navbar
                className={isNavbarHidden ? 'hidden' : ''}
                language={language}
                setLanguage={setLanguage}
                isLoggedIn={isLoggedIn}
                setIsLoggedIn={setIsLoggedIn}
              />

              {/* Horizontal Carousel */}
              {/*
              <HorizontalGamesCarousel
                games={[]} // <-- Asegura que siempre se pase un array, aunque esté vacío
                language={language}
              />
              */}

              {/* Contenido principal */}
              <div className="main-content">
                <Routes>
                  {/* Página Home */}
                  <Route
                    path="/"
                    element={
                      <div className="container">
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
                  <Route path="/teams" element={<TeamsPage language={language} userRole={userRole} />} />
                  {/* Página de Estadísticas */}
                  <Route path="/stats" element={<StatsPage language={language} />} />
                  {/* Página de Partidos */}
                  <Route path="/games" element={<GamesPage language={language} />} />
                  {/* Página de Media */}
                  <Route path="/media" element={<MediaPage language={language} />} />
                  {/* Página de Solicitudes de Admin */}
                  <Route path="/admin/solicitudes" element={<AdminSolicitudes />} />
                  {/* Página de Auditoría/Admin */}
                  <Route path="/admin/auditoria" element={<AdminAuditPage language={language} />} />
                </Routes>
              </div>

              {/* Footer */}
              <Footer language={language} />
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
