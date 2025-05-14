import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css'; // Reutilizar el estilo existente

const Login = ({ setIsLoggedIn }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = () => {
        // Simulación de credenciales
        const credentials = {
            admin: { password: 'admin123', role: 'admin' },
            editor: { password: 'editor123', role: 'editor' },
            manager: { password: 'manager123', role: 'match-manager' }, // Nuevo rol
        };

        if (credentials[username] && credentials[username].password === password) {
            setIsLoggedIn(true); // Set login state to true
            navigate('/'); // Redirect to the home page
        } else {
            setError('Invalid credentials');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h1>Login</h1>
                <div className="input-group">
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="input-field"
                        onKeyDown={handleKeyDown}
                    />
                </div>
                <div className="input-group">
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-field"
                        onKeyDown={handleKeyDown}
                    />
                </div>
                <button onClick={handleLogin} className="login-button">Login</button>
                {error && <p className="error-message">{error}</p>}
            </div>
        </div>
    );
};

export default Login;
