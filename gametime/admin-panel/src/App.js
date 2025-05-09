import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar'; // Importar la nueva Navbar
import Login from './pages/Login';
import MatchManagerDashboard from './pages/MatchManagerDashboard'; // Nuevo nombre
import MatchList from './pages/MatchList'; // Importar el componente de la lista de partidos
// import EditorDashboard from './pages/EditorDashboard'; // Comentado temporalmente
// import AdminDashboard from './pages/AdminDashboard'; // Comentado temporalmente
import './styles/App.css';

const App = () => {
    return (
        <Router>
            <Content />
        </Router>
    );
};

const Content = () => {
    const location = useLocation(); // Hook to get the current route

    return (
        <div>
            {/* Conditionally render Navbar */}
            {location.pathname !== '/' && <Navbar />}
            <Routes>
                {/* Login Page */}
                <Route path="/" element={<Login />} />

                {/* Match Manager Routes */}
                <Route path="/match-manager" element={<MatchManagerDashboard />} />
                <Route path="/match-manager/matches" element={<MatchList />} /> {/* Ruta para ver los partidos */}

                {/* Editor Routes */}
                {/* <Route path="/editor" element={<EditorDashboard />} /> */}

                {/* Admin Routes */}
                {/* <Route path="/admin" element={<AdminDashboard />} /> */}
            </Routes>
        </div>
    );
};

export default App;
