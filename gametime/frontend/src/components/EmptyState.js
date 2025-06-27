import React from 'react';

const EmptyState = ({ 
  icon = "📭", 
  title = "No hay contenido", 
  description = "No se encontraron datos para mostrar.", 
  actionText = null, 
  onAction = null,
  language = 'es' 
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      textAlign: 'center',
      color: '#666',
      background: 'var(--card-background-color, #fff)',
      borderRadius: '12px',
      border: '2px dashed #e0e0e0',
      margin: '20px 0'
    }}>
      <div style={{
        fontSize: '4rem',
        marginBottom: '16px',
        opacity: 0.6
      }}>
        {icon}
      </div>
      
      <h3 style={{
        fontSize: '1.5rem',
        fontWeight: '600',
        marginBottom: '8px',
        color: 'var(--text-color, #333)'
      }}>
        {title}
      </h3>
      
      <p style={{
        fontSize: '1rem',
        marginBottom: '24px',
        maxWidth: '400px',
        lineHeight: '1.5',
        color: '#888'
      }}>
        {description}
      </p>
      
      {actionText && onAction && (
        <button 
          className="btn btn-primary"
          onClick={onAction}
          style={{
            padding: '10px 24px',
            fontSize: '1rem',
            borderRadius: '8px'
          }}
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
