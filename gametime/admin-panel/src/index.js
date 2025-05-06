import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App';
import Dashboard from './pages/Dashboard'; // Página principal después del login
import Login from './pages/Login'; // Importar la nueva página de login

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <Router>
            <Routes>
                <Route path="/" element={<Login />} /> {/* Página de login */}
                <Route path="/dashboard" element={<Dashboard />} /> {/* Página principal */}
            </Routes>
        </Router>
    </React.StrictMode>
);
