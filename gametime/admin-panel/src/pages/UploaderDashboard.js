import React from 'react';
import Navbar from '../components/Navbar';
import '../styles/Dashboard.css';

const UploaderDashboard = ({ username, onLogout }) => {
    return (
        <div>
            <Navbar username={username} role="uploader" onLogout={onLogout} />
            <div className="dashboard-container">
                <h1>Uploader Dashboard</h1>
                <p>Welcome, Uploader! Here you can upload files.</p>
                <div className="button-group">
                    <button className="dashboard-button">Upload Images</button>
                    <button className="dashboard-button">Upload Videos</button>
                </div>
            </div>
        </div>
    );
};

export default UploaderDashboard;
