import React from 'react';
import Navbar from '../components/Navbar';
import '../styles/Dashboard.css';

const AdminDashboard = ({ username, onLogout }) => {
    return (
        <div>
            <Navbar username={username} role="main" onLogout={onLogout} />
            <div className="dashboard-container">
                <h1>Admin Dashboard</h1>
                <p>Welcome, Admin! Here you can manage the system.</p>
                <div className="button-group">
                    <button className="dashboard-button">Manage Matches</button>
                    <button className="dashboard-button">Manage Staff</button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
