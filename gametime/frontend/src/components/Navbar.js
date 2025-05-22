import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Importar Link de react-router-dom
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/Navbar.css';
import logo from '../assets/images/GameTimeLogo.png';
import chileFlag from '../assets/images/ChileBandera.png'; // Importar bandera de Chile
import ukFlag from '../assets/images/ReinoUnidoBandera.png'; // Importar bandera del Reino Unido
import texts from '../translations/texts';
import toggleIcon from '../assets/images/icons8-settings-384.png'; // Import the new image
import whiteCircleIcon from '../assets/images/circulo_blanco.png'; // Importar círculo blanco
import blackCircleIcon from '../assets/images/circulo_negro.png'; // Importar círculo negro
import { API_BASE_URL } from '../assets/Configuration/config';

const Navbar = ({ language, setLanguage, isLoggedIn, setIsLoggedIn }) => {
  const [showSettings, setShowSettings] = useState(false); // State for showing settings dropdown
  const [isNavbarOpen, setIsNavbarOpen] = useState(false); // State for navbar collapse
  const [isTriangleDown, setIsTriangleDown] = useState(false); // State for animation
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const languageSelectorRef = useRef(null); // Referencia al contenedor del selector de idiomas
  const navbarRef = useRef(null); // Reference for the navbar
  const toggleIconRef = useRef(null); // Reference for the settings button
  // Obtener usuario logueado desde localStorage (si existe)
  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null;
    } catch {
      return null;
    }
  });

  // Estado para la cantidad de solicitudes pendientes
  const [pendingCount, setPendingCount] = useState(0);

  // Si es admin, consulta la cantidad de solicitudes pendientes
  useEffect(() => {
    let intervalId;
    const fetchPending = () => {
      if (user && user.esAdmin) {
        fetch(`${API_BASE_URL}/solicitudes-pendientes`)
          .then(res => res.json())
          .then(data => setPendingCount(Array.isArray(data) ? data.length : 0))
          .catch(() => setPendingCount(0));
      }
    };
    fetchPending();
    // Actualiza cada 3 segundos si es admin
    if (user && user.esAdmin) {
      intervalId = setInterval(fetchPending, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user]);

  const handleLanguageChange = (lang) => {
    setLanguage(lang); // Cambiar solo el idioma
    setShowSettings(false); // Ocultar opciones después de seleccionar
    setIsTriangleDown(false); // Asegurar que el triángulo se restablezca
  };

  const handleScreenColorChange = (theme) => {
    document.body.className = theme; // Cambiar solo el tema
    setShowSettings(false); // Cerrar el menú de configuración
    setIsTriangleDown(false); // Asegurar que el triángulo se restablezca
  };

  const handleClickOutside = (event) => {
    if (
      languageSelectorRef.current &&
      !languageSelectorRef.current.contains(event.target) &&
      event.target !== toggleIconRef.current // Asegurar que no cierre al presionar el botón de configuración
    ) {
      setShowSettings(false); // Close the settings dropdown
      setIsTriangleDown(false); // Asegurar que el triángulo se restablezca
    }
    if (
      navbarRef.current &&
      !navbarRef.current.contains(event.target)
    ) {
      setIsNavbarOpen(false); // Close the navbar
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside); // For touch devices
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleToggleClick = (event) => {
    event.preventDefault(); // Prevenir el comportamiento predeterminado
    event.stopPropagation(); // Evitar que el evento se propague
    setShowSettings((prevState) => !prevState); // Alternar el menú de configuración
    setIsTriangleDown((prevState) => !prevState); // Alternar el estado del triángulo
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark" ref={navbarRef}>
      <div className="container-fluid">
        <span className="navbar-brand">
          <img src={logo} alt="GameTime Logo" className="navbar-logo" />
        </span>
        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setIsNavbarOpen(!isNavbarOpen)}
          aria-controls="navbarNav"
          aria-expanded={isNavbarOpen}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div
          className={`collapse navbar-collapse ${isNavbarOpen ? 'show' : ''}`}
          id="navbarNav"
        >
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link active no-underline" to="/">
                {texts[language].navbar_home}
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link no-underline" to="/teams">
                {texts[language].navbar_teams}
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link no-underline" to="/stats">
                {texts[language].navbar_statistics}
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link no-underline" to="/games">
                {texts[language].navbar_upcoming_games}
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link no-underline" to="/media">
                {texts[language].navbar_media}
              </Link>
            </li>
            {/* Solo mostrar al admin */}
            {user && user.esAdmin && (
              <>
                <li className="nav-item">
                  <Link className="nav-link no-underline" to="/admin/solicitudes">
                    Solicitudes de Registro
                    {pendingCount > 0 && (
                      <span
                        style={{
                          background: '#ffb300',
                          color: '#23272b',
                          borderRadius: '10px',
                          padding: '2px 8px',
                          marginLeft: '8px',
                          fontWeight: 'bold',
                          fontSize: '13px'
                        }}
                      >
                        {pendingCount}
                      </span>
                    )}
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link no-underline" to="/admin/auditoria">
                    Auditoría
                  </Link>
                </li>
              </>
            )}
          </ul>
          <div className="d-flex align-items-center ms-auto">
            <div
              className="language-selector position-relative"
              ref={languageSelectorRef}
            >
              <button
                className={`btn triangle-btn ${isTriangleDown ? 'triangle-down' : ''}`}
                aria-label="Settings"
                onClick={handleToggleClick}
                ref={toggleIconRef}
              >
                <img src={toggleIcon} alt="Toggle Settings" className="language-toggle-icon" />
              </button>
              {showSettings && (
                <div
                  className={
                    `settings-options position-absolute${isMobile ? ' settings-options-mobile' : ''}`
                  }
                >
                  <div className="settings-section">
                    <span className="settings-title">{texts[language]?.navbar_language || 'Idioma'}</span>
                    <button
                      className="btn btn-link d-flex align-items-center no-underline"
                      onClick={() => handleLanguageChange('es')}
                    >
                      <img src={chileFlag} alt="Español" className="language-flag me-2" />
                      <span>Español</span>
                    </button>
                    <button
                      className="btn btn-link d-flex align-items-center no-underline"
                      onClick={() => handleLanguageChange('en')}
                    >
                      <img src={ukFlag} alt="English" className="language-flag me-2" />
                      <span>English</span>
                    </button>
                  </div>
                  <div className="settings-section">
                    <span className="settings-title">{texts[language]?.theme || 'Theme'}</span>
                    <button
                      className="btn btn-link d-flex align-items-center no-underline"
                      onClick={() => handleScreenColorChange('theme-light')}
                    >
                      <img src={whiteCircleIcon} alt="Light Mode" className="language-flag me-2" />
                      <span>{texts[language]?.theme_light || 'Light Mode'}</span>
                    </button>
                    <button
                      className="btn btn-link d-flex align-items-center no-underline"
                      onClick={() => handleScreenColorChange('theme-dark')}
                    >
                      <img src={blackCircleIcon} alt="Dark Mode" className="language-flag me-2" />
                      <span>{texts[language]?.theme_dark || 'Dark Mode'}</span>
                    </button>
                  </div>
                  <div className="settings-section">
                    {/* Mostrar información de cuenta si está logueado */}
                    {user && (
                      <div className="account-type-box mb-2 text-start">
                        <span style={{ color: '#aaa', fontWeight: 'normal', fontSize: '13px' }}>
                          Cuenta actual:
                        </span>
                        <br />
                        <span>
                          {user.esAdmin ? (
                            <span className="admin-label">
                              ADMINISTRADOR
                            </span>
                          ) : (
                            user.tipoCuenta === 'match-manager'
                              ? 'Gestor de Partido'
                              : user.tipoCuenta === 'content-editor'
                              ? 'Editor de Contenido'
                              : 'Público'
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="settings-section">
                    {isLoggedIn ? (
                      <button
                        className="btn btn-danger w-100 mt-2" // Logout button with red color
                        onClick={handleLogout}
                      >
                        {texts[language]?.navbar_logout || 'Logout'}
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary w-100 mt-2" // Login button with blue color
                        onClick={() => window.location.href = '/login'}
                      >
                        {texts[language]?.navbar_login || 'Login'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
