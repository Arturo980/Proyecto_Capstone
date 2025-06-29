import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';
import { API_BASE_URL } from '../assets/Configuration/config';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!email) {
            setError('Por favor ingresa tu correo electrónico');
            return;
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Por favor ingresa un correo electrónico válido');
            return;
        }

        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch(`${API_BASE_URL}/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo: email }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message);
                setEmail(''); // Limpiar el campo
            } else {
                setError(data.error || 'Error al procesar la solicitud');
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

    return (
        <div className="login-container">
            <div className="login-box">
                <h1>¿Olvidaste tu contraseña?</h1>
                <p className="forgot-password-description">
                    Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                </p>
                
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <input
                            type="email"
                            placeholder="Correo electrónico"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-field"
                            onKeyDown={handleKeyDown}
                            disabled={isLoading}
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        className="login-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                    </button>
                </form>

                {message && (
                    <div className="success-message">
                        <p>{message}</p>
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

export default ForgotPassword;
