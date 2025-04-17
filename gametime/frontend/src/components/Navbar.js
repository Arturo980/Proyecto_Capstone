import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Importar Link de react-router-dom
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/Navbar.css';
import logo from '../assets/images/GameTimeLogo.png';
import chileFlag from '../assets/images/ChileBandera.png'; // Importar bandera de Chile
import ukFlag from '../assets/images/ReinoUnidoBandera.png'; // Importar bandera del Reino Unido
import texts from '../translations/texts';

const Navbar = ({ language, setLanguage }) => {
  const [showLanguages, setShowLanguages] = useState(false); // Estado para mostrar/ocultar opciones
  const [isNavbarOpen, setIsNavbarOpen] = useState(false); // State for navbar collapse
  const languageSelectorRef = useRef(null); // Referencia al contenedor del selector de idiomas
  const navbarRef = useRef(null); // Reference for the navbar

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setShowLanguages(false); // Ocultar opciones después de seleccionar
  };

  const handleClickOutside = (event) => {
    if (
      languageSelectorRef.current &&
      !languageSelectorRef.current.contains(event.target)
    ) {
      setShowLanguages(false); // Close the language selector
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
              <Link className="nav-link active" to="/">
                {texts[language].navbar_home}
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/teams">
                {texts[language].navbar_teams}
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/stats">
                {texts[language].navbar_statistics}
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/games">
                {texts[language].navbar_upcoming_games}
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/media">
                {texts[language].navbar_media}
              </Link>
            </li>
          </ul>
          <div
            className="language-selector position-relative"
            ref={languageSelectorRef}
          >
            <button
              className="btn navbar-btn d-flex align-items-center"
              onClick={() => setShowLanguages(!showLanguages)}
            >
              <img
                src={language === 'en' ? ukFlag : chileFlag}
                alt={language === 'en' ? 'English' : 'Español'}
                className="language-flag me-2"
              />
              <span>{language === 'en' ? 'English' : 'Español'}</span>
            </button>
            {showLanguages && (
              <div className="language-options position-absolute">
                <button
                  className="btn btn-link d-flex align-items-center"
                  onClick={() => handleLanguageChange('en')}
                >
                  <img src={ukFlag} alt="English" className="language-flag me-2" />
                  <span>English</span>
                </button>
                <button
                  className="btn btn-link d-flex align-items-center"
                  onClick={() => handleLanguageChange('es')}
                >
                  <img src={chileFlag} alt="Español" className="language-flag me-2" />
                  <span>Español</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
