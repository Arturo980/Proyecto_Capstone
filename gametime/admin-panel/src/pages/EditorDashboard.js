import React from 'react';
import Navbar from '../components/Navbar';
import '../styles/Dashboard.css';

const EditorDashboard = ({ username, onLogout }) => {
    return (
        <div>
            <Navbar username={username} role="editor" onLogout={onLogout} />
            <div className="dashboard-container">
                <h1>Editor Dashboard</h1>
                <p>Welcome, Editor! Here you can manage content.</p>
                <div className="button-group">
                    <button className="dashboard-button">Edit Articles</button>
                    <button className="dashboard-button">Review Submissions</button>
                </div>
            </div>
        </div>
    );
};

export default EditorDashboard;
