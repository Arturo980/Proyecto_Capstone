import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar';

const Dashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { role, username } = location.state || {};

    React.useEffect(() => {
        if (!role) {
            navigate('/'); // Redirigir al login si no hay rol
        }
    }, [role, navigate]);

    const handleLogout = () => {
        navigate('/'); // Redirigir al login
    };

    return (
        <div>
            <Navbar username={username || 'User'} role={role} onLogout={handleLogout} />
            <div className="dashboard-content">
                <h1>Welcome to the Dashboard</h1>
                {role === 'main' && <p>Admin-specific configuration</p>}
                {role === 'editor' && <p>Editor-specific configuration</p>}
                {role === 'uploader' && <p>Uploader-specific configuration</p>}
            </div>
        </div>
    );
};

export default Dashboard;
