import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

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
            console.log('Enviando login:', { correo: email, contraseña: password });
            const response = await fetch('http://localhost:3001/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo: email, contraseña: password }),
            });
            console.log('Status de respuesta:', response.status);
            let data;
            try {
                data = await response.json();
            } catch (jsonErr) {
                // Intenta leer el texto para mostrarlo en el error
                const text = await response.text();
                setError(`Respuesta inesperada del servidor (status ${response.status}): ${text}`);
                console.error('No se pudo parsear JSON:', jsonErr, 'Contenido recibido:', text);
                return;
            }
            console.log('Respuesta del backend:', data);
            if (response.ok) {
                // Guarda el usuario en localStorage para que la navbar lo pueda leer
                if (data.usuario) {
                    localStorage.setItem('user', JSON.stringify(data.usuario));
                }
                setIsLoggedIn(true);
                setError('');
                navigate('/');
            } else {
                // Mostrar mensaje especial si la cuenta no está aprobada
                if (data.error && data.error.includes('aún no ha sido aprobada')) {
                    setError('Tu cuenta aún no ha sido aprobada por el administrador.');
                } else {
                    setError(data.error || 'Invalid credentials');
                }
            }
        } catch (err) {
            setError('Server connection error: ' + err.message);
            console.error('Error de conexión:', err);
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
