import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Importar Link de react-router-dom
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/Navbar.css';
import logo from '../assets/images/GameTimeLogo.png';
import chileFlag from '../assets/images/ChileBandera.png'; // Importar bandera de Chile
import ukFlag from '../assets/images/ReinoUnidoBandera.png'; // Importar bandera del Reino Unido
import texts from '../translations/texts';
import toggleIcon from '../assets/images/icons8-settings-384.png'; // Import the new image

const Navbar = ({ language, setLanguage }) => {
  const [showSettings, setShowSettings] = useState(false); // State for showing settings dropdown
  const [isNavbarOpen, setIsNavbarOpen] = useState(false); // State for navbar collapse
  const [isTriangleDown, setIsTriangleDown] = useState(false); // State for animation
  const languageSelectorRef = useRef(null); // Referencia al contenedor del selector de idiomas
  const navbarRef = useRef(null); // Reference for the navbar
  const toggleIconRef = useRef(null); // Reference for the settings button

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

  const handleSettingsToggle = () => {
    setShowSettings(!showSettings); // Toggle the settings dropdown
  };

  const handleMouseEnter = () => {
    setShowSettings(true); // Show settings dropdown on hover
    if (!isTriangleDown) setIsTriangleDown(true); // Ensure the triangle rotates down
  };

  const handleMouseLeave = () => {
    setShowSettings(false); // Hide settings dropdown when mouse leaves
    if (isTriangleDown) setIsTriangleDown(false); // Ensure the triangle rotates back up
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

  const handleToggleClick = () => {
    setShowSettings((prevState) => !prevState); // Toggle the settings dropdown
    setIsTriangleDown((prevState) => !prevState); // Toggle the triangle state
  };

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
          </ul>
          <div className="d-flex align-items-center ms-auto">
            <div
              className="language-selector position-relative"
              ref={languageSelectorRef}
              onMouseEnter={handleMouseEnter} // Open on hover
              onMouseLeave={handleMouseLeave} // Close when mouse leaves
            >
              <button
                className={`btn triangle-btn ${isTriangleDown ? 'triangle-down' : ''}`}
                aria-label="Settings"
                onClick={handleToggleClick} // Usar la función de toggle
                ref={toggleIconRef} // Referencia al botón de configuración
              >
                <img src={toggleIcon} alt="Toggle Settings" className="language-toggle-icon" />
              </button>
              {showSettings && (
                <div className="settings-options position-absolute">
                  <div className="settings-section">
                    <span className="settings-title">{texts[language]?.navbar_language || 'Language'}</span>
                    <button
                      className="btn btn-link d-flex align-items-center no-underline"
                      onClick={() => handleLanguageChange('en')}
                    >
                      <img src={ukFlag} alt="English" className="language-flag me-2" />
                      <span>English</span>
                    </button>
                    <button
                      className="btn btn-link d-flex align-items-center no-underline"
                      onClick={() => handleLanguageChange('es')}
                    >
                      <img src={chileFlag} alt="Español" className="language-flag me-2" />
                      <span>Español</span>
                    </button>
                  </div>
                  <div className="settings-section">
                    <span className="settings-title">{texts[language]?.theme || 'Theme'}</span>
                    <button
                      className="btn btn-link no-underline"
                      onClick={() => handleScreenColorChange('theme-light')}
                    >
                      {texts[language]?.theme_light || 'Light Mode'}
                    </button>
                    <button
                      className="btn btn-link no-underline"
                      onClick={() => handleScreenColorChange('theme-dark')}
                    >
                      {texts[language]?.theme_dark || 'Dark Mode'}
                    </button>
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
