import React from 'react';
import { Link } from 'react-router-dom';

const MatchManagerDashboard = () => {
    return (
        <div>
            <h1>Match Manager Dashboard</h1>
            <p>Registrar jugadores convocados al partido.</p>
            <p>Actualizar el marcador en vivo.</p>
            <Link to="/match-manager/matches" className="view-matches-link">
                View All Matches
            </Link>
        </div>
    );
};

export default MatchManagerDashboard;
