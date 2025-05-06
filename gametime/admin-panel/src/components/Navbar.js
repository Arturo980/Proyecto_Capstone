import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Navbar.css'; // Actualizar la ruta del CSS

const Navbar = ({ username, role, onLogout }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        onLogout(); // Llamar a la función pasada como prop
        navigate('/');
    };

    const handleNavigation = (path) => {
        navigate(path); // Redirigir a la ruta especificada
    };

    const getGreeting = () => {
        switch (role) {
            case 'main':
                return `Welcome, Admin ${username}`;
            case 'editor':
                return `Welcome, Editor ${username}`;
            case 'uploader':
                return `Welcome, Uploader ${username}`;
            default:
                return `Welcome, ${username}`;
        }
    };

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <h2>{getGreeting()}</h2>
            </div>
            <div className="navbar-right">
                <button onClick={handleLogout} className="logout-button">Logout</button>
            </div>
        </nav>
    );
};

export default Navbar;
