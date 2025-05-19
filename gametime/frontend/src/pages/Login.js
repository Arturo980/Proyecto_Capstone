import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';
import { API_BASE_URL } from '../assets/Configuration/config';

const Login = ({ setIsLoggedIn }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo: email, contraseña: password }),
            });
            let data;
            try {
                data = await response.json();
            } catch (jsonErr) {
                const text = await response.text();
                setError(`Respuesta inesperada del servidor (status ${response.status}): ${text}`);
                return;
            }
            if (response.ok) {
                if (data.usuario) {
                    localStorage.setItem('user', JSON.stringify(data.usuario));
                }
                setIsLoggedIn(true);
                setError('');
                navigate('/');
            } else {
                if (data.error && data.error.includes('aún no ha sido aprobada')) {
                    setError('Tu cuenta aún no ha sido aprobada por el administrador.');
                } else {
                    setError(data.error || 'Invalid credentials');
                }
            }
        } catch (err) {
            setError('Server connection error: ' + err.message);
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
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                <div className="link-group">
                    <a href="/register" className="link">Create Account</a>
                    <br />
                    <a href="/forgot-password" className="link">Forgot Password?</a>
                </div>
            </div>
        </div>
    );
};

export default Login;
