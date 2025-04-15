import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom'; // Importar Link de react-router-dom
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/Navbar.css';
import logo from '../assets/images/GameTimeLogo.png';
import texts from '../translations/texts';

const Navbar = ({ language, setLanguage }) => {
  const [showLanguages, setShowLanguages] = useState(false); // Estado para mostrar/ocultar opciones
  const languageSelectorRef = useRef(null); // Referencia al contenedor del selector de idiomas

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setShowLanguages(false); // Ocultar opciones después de seleccionar
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <span className="navbar-brand">
          <img src={logo} alt="GameTime Logo" className="navbar-logo" />
        </span>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
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
              <a className="nav-link" href="#games">
                {texts[language].navbar_games}
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#media">
                {texts[language].navbar_media}
              </a>
            </li>
          </ul>
          <div
            className="language-selector"
            ref={languageSelectorRef}
            onMouseEnter={() => setShowLanguages(true)}
            onMouseLeave={() => setShowLanguages(false)}
          >
            <button className="btn navbar-btn">
              {language === 'en' ? 'English' : 'Español'}
            </button>
            {showLanguages && (
              <div className="language-options">
                <button
                  className="btn btn-link"
                  onClick={() => handleLanguageChange('en')}
                >
                  English
                </button>
                <button
                  className="btn btn-link"
                  onClick={() => handleLanguageChange('es')}
                >
                  Español
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
