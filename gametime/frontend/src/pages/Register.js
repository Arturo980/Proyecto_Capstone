import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css'; // Reuse existing styles
import { API_BASE_URL } from '../assets/Configuration/config';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [accountType, setAccountType] = useState('public'); // Default to "Public"
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleRegister = async () => {
        if (username && email && password && accountType) {
            try {
                // Log para depuración
                console.log('Enviando datos de registro:', {
                    nombre: username,
                    correo: email,
                    contraseña: password,
                    tipoCuenta: accountType,
                });

                const response = await fetch(`${API_BASE_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nombre: username,
                        correo: email,
                        contraseña: password,
                        tipoCuenta: accountType,
                    }),
                });

                const data = await response.json();

                // Log para depuración
                console.log('Respuesta del backend:', data);

                if (response.ok) {
                    setSuccess(data.message || 'Usuario registrado con éxito');
                    setError('');
                    // Solo redirige automáticamente si es público
                    if (accountType === 'public') {
                        setTimeout(() => navigate('/login'), 2000);
                    }
                    // Si es gestor de partido o editor de contenido, espera 5 segundos y redirige a la página principal
                    if (accountType === 'content-editor' || accountType === 'match-manager') {
                        setTimeout(() => navigate('/'), 5000);
                    }
                } else {
                    setError(data.error || 'Error al registrar el usuario');
                    setSuccess('');
                }
            } catch (err) {
                setError('Error de conexión con el servidor: ' + err.message);
                setSuccess('');
            }
        } else {
            setError('All fields are required');
            setSuccess('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleRegister();
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h1>Register</h1>
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
                <div className="input-group">
                    <select
                        value={accountType}
                        onChange={(e) => setAccountType(e.target.value)}
                        className="input-field"
                    >
                        <option value="match-manager">Gestor de Partido</option>
                        <option value="content-editor">Editor de Contenido</option>
                        <option value="public">Publico</option>
                    </select>
                </div>
                <button onClick={handleRegister} className="login-button">Register</button>
                {error && <p className="error-message">{error}</p>}
                {success && (
                    <p className="success-message">
                        {success}
                        {accountType !== 'public' && success && (
                            <span><br />Tu cuenta será revisada por un administrador antes de poder acceder.</span>
                        )}
                    </p>
                )}
                <div className="link-group">
                    <a href="/login" className="link">Already have an account? Login</a>
                </div>
            </div>
        </div>
    );
};

export default Register;
