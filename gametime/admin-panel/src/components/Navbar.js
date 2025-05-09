import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';

const Navbar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        // Lógica para cerrar sesión
        navigate('/');
    };

    return (
        <nav className="navbar">
            <div className="navbar-logo">
                <Link to="/">GameTime</Link>
            </div>
            <div className="navbar-links">
                <Link to="/match-manager/matches">Matches</Link>
                <button onClick={handleLogout} className="logout-button">Logout</button>
            </div>
        </nav>
    );
};

export default Navbar;
