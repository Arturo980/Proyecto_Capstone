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
import ForgotPassword from './pages/ForgotPassword'; // Importar la página de Olvidé mi contraseña
import ResetPassword from './pages/ResetPassword'; // Importar la página de Restablecer contraseña
import AdminSolicitudes from './pages/AdminSolicitudes'; // Importar la página de Solicitudes de Admin
import AdminAuditPage from './pages/AdminAuditPage';
import texts from './translations/texts';
import HorizontalGamesCarousel from './components/HorizontalGamesCarousel'; // Importar el nuevo componente
import { API_BASE_URL } from './assets/Configuration/config';
import TeamDetailPage from './pages/TeamDetailPage'; 
import PlayerDetailPage from './pages/PlayerDetailPage';
import LoadingSpinner from './components/LoadingSpinner';
import logoEmpresa from './assets/images/GameTime.png';
import NewsEditorPage from './pages/NewsEditorPage';
import NewsDetailPage from './pages/NewsDetailPage';
import NewsPage from './pages/NewsPage'; 

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

  // Elimina showSplash, showContent, splashDots
  // Agrega un estado para saber si la app está cargando datos iniciales
  const [appLoading, setAppLoading] = useState(true);
  const [showLogoSplash, setShowLogoSplash] = useState(true);

  // Splash de logo: mostrar solo el logo por 1.2s
  useEffect(() => {
    const timer = setTimeout(() => setShowLogoSplash(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Cargar ligas al montar
  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const res = await fetch(API_LEAGUES);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setLeagues(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) setActiveLeague(data[0]._id);
        else setActiveLeague(''); // <-- Asegura que nunca sea null
      } catch (error) {
        console.warn('Failed to fetch leagues:', error.message);
        setLeagues([]);
        setActiveLeague(''); // <-- Asegura que nunca sea null
      } finally {
        setAppLoading(false); // Oculta el splash cuando termina la carga inicial
      }
    };
    fetchLeagues();
  }, [API_LEAGUES]);

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
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => setTeams(data.teams || []))
      .catch(error => {
        console.warn('Failed to fetch teams:', error.message);
        setTeams([]);
      });
    // Partidos
    fetch(`${API_BASE_URL}/api/games?league=${activeLeague}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => setGames(data.games || []))
      .catch(error => {
        console.warn('Failed to fetch games:', error.message);
        setGames([]);
      });
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
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
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
      } catch (error) {
        console.warn('Failed to fetch carousel games:', error.message);
        setCarouselGames([]);
      }
    };
    fetchGames();
  }, [activeLeague, API_GAMES]);

  useEffect(() => {
    // Asegura que el tema claro esté aplicado por defecto
    if (!document.body.className) {
      document.body.className = 'theme-light';
    }
  }, []);

  // Manejar scroll para ocultar/mostrar navbar
  useEffect(() => {
    let lastY = 0;
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          
          // Mostrar navbar si estamos en la parte superior de la página
          if (currentScrollY < 10) {
            setIsNavbarHidden(false);
          }
          // Ocultar navbar al hacer scroll hacia abajo, mostrar al hacer scroll hacia arriba
          else if (currentScrollY > lastY && currentScrollY > 80) {
            setIsNavbarHidden(true);
          } else if (currentScrollY < lastY) {
            setIsNavbarHidden(false);
          }
          
          lastY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const carousel = document.querySelector('.horizontal-carousel-wrapper');
      if (carousel && carousel.contains(e.target)) {
        setIsNavbarHidden(false); // Mostrar la barra si el mouse está sobre el carrusel
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // NUEVO: Función para manejar cambio de liga desde StandingsTable
  const handleActiveLeagueChange = (leagueId) => {
    setActiveLeague(leagueId);
    // No navegamos aquí porque StandingsTable está en la home page
    // Solo actualizamos el estado
  };

  // Splash: primero logo, luego spinner si sigue cargando
  if (showLogoSplash) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          zIndex: 9999,
          background: '#181a1b',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <img
          src={logoEmpresa}
          alt="Logo Empresa"
          style={{ width: 220, maxWidth: '70vw', marginBottom: 0 }}
        />
      </div>
    );
  }

  // Renderiza el splash con logo y spinner mientras appLoading es true
  if (appLoading) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          zIndex: 9999,
          background: '#181a1b',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <img
          src={logoEmpresa}
          alt="Logo Empresa"
          style={{ width: 180, maxWidth: '60vw', marginBottom: 32 }}
        />
        <LoadingSpinner />
      </div>
    );
  }

  // El splash y el contenido principal se renderizan juntos, el splash está por encima
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <div id="root" className="splash-content-show">
        <Router>
          <Routes>
            {/* Página de Login */}
            <Route
              path="/login"
              element={
                <div>
                  <Login setIsLoggedIn={setIsLoggedIn} />
                </div>
              }
            />
            {/* Página de Registro */}
            <Route
              path="/register"
              element={
                <div>
                  <Register />
                </div>
              }
            />
            {/* Página de Olvidé mi contraseña */}
            <Route
              path="/forgot-password"
              element={
                <div>
                  <ForgotPassword />
                </div>
              }
            />
            {/* Página de Restablecer contraseña */}
            <Route
              path="/reset-password"
              element={
                <div>
                  <ResetPassword />
                </div>
              }
            />
            {/* Rutas principales */}
            <Route
              path="*"
              element={
                <div>
                  {/* Navbar */}
                  <Navbar
                    className={isNavbarHidden ? 'hidden' : ''}
                    isNavbarHidden={isNavbarHidden}
                    language={language}
                    setLanguage={setLanguage}
                    isLoggedIn={isLoggedIn}
                    setIsLoggedIn={setIsLoggedIn}
                  />

                  {/* Contenido principal */}
                  <div style={{ overflowX: 'hidden' }}>
                    {/* Horizontal Carousel */}
                    <HorizontalGamesCarousel
                      games={carouselGames}
                      language={language}
                      leagues={leagues}
                      appLoading={appLoading}
                    />

                    {/* Rutas internas */}
                    <Routes>
                    {/* Página Home: layout especial */}
                    <Route
                      path="/"
                      element={
                        <div style={{ minHeight: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <div className="main-content-responsive">
                            <div className="carousel-section">
                              <ControlledCarousel language={language} />
                            </div>
                            <div className="standings-section">
                              <div className="standings-header">
                                <h3
                                  className="standings-title-text"
                                  style={{ marginBottom: 0 }}
                                >
                                  {texts[language].standings_title}
                                </h3>
                                <div className="standings-underline"></div>
                              </div>
                              <StandingsTable
                                language={language}
                                leagues={leagues}
                                activeLeague={activeLeague}
                                setActiveLeague={handleActiveLeagueChange}
                                teams={teams}
                                games={games}
                                leagueConfig={leagueConfig}
                              />
                            </div>
                          </div>
                        </div>
                      }
                    />
                    {/* Página de noticias */}
                    <Route path="/news" element={<NewsPage language={language} />} />
                    {/* Página para agregar noticia (solo editores) */}
                    <Route path="/news/add" element={<NewsEditorPage language={language} />} />
                    {/* Página para editar noticia (solo editores) */}
                    <Route path="/news/:id/edit" element={<NewsEditorPage language={language} />} />
                    {/* Página de detalle de noticia */}
                    <Route path="/news/:id" element={<NewsDetailPage language={language} />} />
                    {/* Otras páginas: agrega marginTop y marginBottom */}
                    <Route path="/teams" element={<div className="container" style={{ marginTop: 48, marginBottom: 48 }}><TeamsPage language={language} userRole={userRole} /></div>} />
                    <Route path="/teams/:leagueId" element={<div className="container" style={{ marginTop: 48, marginBottom: 48 }}><TeamsPage language={language} userRole={userRole} /></div>} />
                    <Route path="/teams/:leagueParam/:teamParam" element={<div className="page-wrapper" style={{ minHeight: 'calc(100vh - 160px)', marginTop: 48, marginBottom: 48 }}><div className="container"><TeamDetailPage language={language} userRole={userRole} /></div></div>} />
                    <Route path="/teams/:leagueParam/:teamParam/player/:playerIndex" element={<div className="page-wrapper" style={{ minHeight: 'calc(100vh - 160px)', marginTop: 48, marginBottom: 48 }}><div className="container"><PlayerDetailPage language={language} /></div></div>} />
                    <Route path="/stats" element={<div className="container" style={{ marginTop: 48, marginBottom: 48 }}><StatsPage language={language} /></div>} />
                    <Route path="/games" element={<div className="container" style={{ marginTop: 48, marginBottom: 48 }}><GamesPage language={language} /></div>} />
                    <Route path="/media" element={<div className="container" style={{ marginTop: 48, marginBottom: 48 }}><MediaPage language={language} /></div>} />
                    <Route path="/admin/solicitudes" element={<div className="container" style={{ marginTop: 48, marginBottom: 48 }}><AdminSolicitudes /></div>} />
                    <Route path="/admin/auditoria" element={<div className="container" style={{ marginTop: 48, marginBottom: 48 }}><AdminAuditPage language={language} /></div>} />
                    </Routes>

                    {/* Footer */}
                    <Footer language={language} />
                  </div>
                </div>
              }
            />
          </Routes>
        </Router>
      </div>
    </div>
  );
}

export default App;
