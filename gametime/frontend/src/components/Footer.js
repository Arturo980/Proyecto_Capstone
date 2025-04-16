import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const Footer = () => {
  return (
    <footer className="bg-dark text-white text-center py-3">
      <div className="container">
        <p>&copy; 2025 Gametime. Todos los derechos reservados.</p>
        <p>
          Síguenos en: 
          <a href="https://facebook.com" className="text-white mx-2">Facebook</a> | 
          <a href="https://twitter.com" className="text-white mx-2">Twitter</a> | 
          <a href="https://instagram.com" className="text-white mx-2">Instagram</a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
