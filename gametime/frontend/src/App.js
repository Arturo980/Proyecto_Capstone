import React, { useState, useEffect, useCallback } from 'react';
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
import { API_BASE_URL } from './assets/Configuration/config';

function App() {
  const [language, setLanguage] = useState('es'); // Cambia 'en' por 'es'
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
  const [carouselGames, setCarouselGames] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [activeLeague, setActiveLeague] = useState(''); // <-- Cambia null por ''

  // NUEVO: Estados para equipos y partidos de la liga activa
  const [teams, setTeams] = useState([]);
  const [games, setGames] = useState([]);
  const [leagueConfig, setLeagueConfig] = useState({});

  // Obtén la URL de la API de partidos y ligas
  const API_GAMES = `${API_BASE_URL}/api/games`;
  const API_LEAGUES = `${API_BASE_URL}/api/leagues`;

  // Cargar ligas al montar
  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const res = await fetch(API_LEAGUES);
        const data = await res.json();
        setLeagues(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) setActiveLeague(data[0]._id);
        else setActiveLeague(''); // <-- Asegura que nunca sea null
      } catch {
        setLeagues([]);
        setActiveLeague(''); // <-- Asegura que nunca sea null
      }
    };
    fetchLeagues();
  }, []);

  // NUEVO: Cargar equipos y partidos de la liga activa
  useEffect(() => {
    if (!activeLeague) {
      setTeams([]);
      setGames([]);
      setLeagueConfig({});
      return;
    }
    // Equipos
    fetch(`${API_BASE_URL}/api/teams?league=${activeLeague}`)
      .then(res => res.json())
      .then(data => setTeams(data.teams || []))
      .catch(() => setTeams([]));
    // Partidos
    fetch(`${API_BASE_URL}/api/games?league=${activeLeague}`)
      .then(res => res.json())
      .then(data => setGames(data.games || []))
      .catch(() => setGames([]));
    // Configuración de liga
    const liga = leagues.find(l => l._id === activeLeague);
    setLeagueConfig(liga || {});
  }, [activeLeague, leagues]);

  // Cargar partidos para el carrusel (solo partidos de la semana actual de la liga activa)
  useEffect(() => {
    if (!activeLeague) return;
    const fetchGames = async () => {
      try {
        const res = await fetch(`${API_GAMES}?league=${activeLeague}`);
        const data = await res.json();
        // Calcular inicio y fin de la semana actual (lunes a domingo)
        const now = new Date();
        const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // 1=lunes, 7=domingo
        const monday = new Date(now);
        monday.setDate(now.getDate() - (dayOfWeek - 1));
        monday.setHours(0, 0, 0, 0);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        // Filtrar partidos de la semana actual
        const filtered = (data.games || []).filter(g => {
          if (!g.date) return false;
          const gameDate = new Date(g.date + 'T' + (g.time || '00:00'));
          return gameDate >= monday && gameDate <= sunday;
        }).sort((a, b) => {
          const da = new Date(a.date + 'T' + (a.time || '00:00'));
          const db = new Date(b.date + 'T' + (b.time || '00:00'));
          return da - db;
        });
        setCarouselGames(filtered);
      } catch {
        setCarouselGames([]);
      }
    };
    fetchGames();
  }, [activeLeague]);

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
              <HorizontalGamesCarousel
                games={carouselGames}
                language={language}
              />

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
                            <StandingsTable
                              language={language}
                              leagues={leagues}
                              activeLeague={activeLeague}
                              setActiveLeague={setActiveLeague}
                              teams={teams}
                              games={games}
                              leagueConfig={leagueConfig}
                            />
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
