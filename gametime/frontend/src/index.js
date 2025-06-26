import React from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css'; // Importar estilos de Bootstrap
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // Importar scripts de Bootstrap
import App from './App';
import './styles/GamePage.css';

// Agrega el link de Material Symbols para el ícono de calendario
const materialSymbolsLink = document.createElement('link');
materialSymbolsLink.rel = 'stylesheet';
materialSymbolsLink.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=calendar_month';
document.head.appendChild(materialSymbolsLink);

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
