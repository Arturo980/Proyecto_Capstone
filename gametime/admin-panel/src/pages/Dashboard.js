import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import EditorDashboard from './EditorDashboard';
import UploaderDashboard from './UploaderDashboard';

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

    if (role === 'main') {
        return <AdminDashboard username={username} onLogout={handleLogout} />;
    } else if (role === 'editor') {
        return <EditorDashboard username={username} onLogout={handleLogout} />;
    } else if (role === 'uploader') {
        return <UploaderDashboard username={username} onLogout={handleLogout} />;
    } else {
        return <p>Unauthorized access</p>;
    }
};

export default Dashboard;
