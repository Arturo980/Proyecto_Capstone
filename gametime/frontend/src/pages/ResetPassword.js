import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../styles/Login.css';
import { API_BASE_URL } from '../assets/Configuration/config';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isValidToken, setIsValidToken] = useState(null);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get('token');

    useEffect(() => {
        // Verificar si el token es válido al cargar la página
        const verifyToken = async () => {
            if (!token) {
                setError('Token de recuperación no encontrado');
                setIsValidToken(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/verify-reset-token/${token}`, {
                    method: 'GET',
                });

                const data = await response.json();

                if (response.ok && data.valid) {
                    setIsValidToken(true);
                } else {
                    setError(data.error || 'Token inválido o expirado');
                    setIsValidToken(false);
                }
            } catch (err) {
                setError('Error verificando el token: ' + err.message);
                setIsValidToken(false);
            }
        };

        verifyToken();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!password || !confirmPassword) {
            setError('Por favor completa todos los campos');
            return;
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch(`${API_BASE_URL}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    token: token,
                    nuevaContraseña: password 
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('¡Contraseña restablecida exitosamente!');
                setPassword('');
                setConfirmPassword('');
                
                // Redirigir al login después de 3 segundos
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                setError(data.error || 'Error al restablecer la contraseña');
            }
        } catch (err) {
            setError('Error de conexión con el servidor: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSubmit(e);
        }
    };

    // Mostrar loading mientras se verifica el token
    if (isValidToken === null) {
        return (
            <div className="login-container">
                <div className="login-box">
                    <h1>Verificando token...</h1>
                    <p>Por favor espera mientras verificamos tu enlace de recuperación.</p>
                </div>
            </div>
        );
    }

    // Mostrar error si el token no es válido
    if (isValidToken === false) {
        return (
            <div className="login-container">
                <div className="login-box">
                    <h1>Enlace inválido</h1>
                    <p className="error-message">{error}</p>
                    <p>Este enlace puede haber expirado o ser inválido.</p>
                    <div className="link-group">
                        <a href="/forgot-password" className="link">Solicitar nuevo enlace</a>
                        <br />
                        <a href="/login" className="link">← Volver al inicio de sesión</a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="login-container">
            <div className="login-box">
                <h1>Restablecer Contraseña</h1>
                <p className="forgot-password-description">
                    Ingresa tu nueva contraseña.
                </p>
                
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <input
                            type="password"
                            placeholder="Nueva contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field"
                            onKeyDown={handleKeyDown}
                            disabled={isLoading}
                            minLength="6"
                        />
                    </div>
                    
                    <div className="input-group">
                        <input
                            type="password"
                            placeholder="Confirmar nueva contraseña"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="input-field"
                            onKeyDown={handleKeyDown}
                            disabled={isLoading}
                            minLength="6"
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        className="login-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Actualizando...' : 'Actualizar contraseña'}
                    </button>
                </form>

                {message && (
                    <div className="success-message">
                        <p>{message}</p>
                        <p>Serás redirigido al inicio de sesión en unos segundos...</p>
                    </div>
                )}
                
                {error && <p className="error-message">{error}</p>}
                
                <div className="link-group">
                    <a href="/login" className="link">← Volver al inicio de sesión</a>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
