import React from 'react';

const ConfirmModal = ({ 
  show, 
  onHide, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirmar', 
  cancelText = 'Cancelar',
  confirmVariant = 'danger'
}) => {
  if (!show) return null;

  const getIcon = () => {
    if (confirmVariant === 'danger') return '⚠️';
    if (confirmVariant === 'warning') return '⚠️';
    if (confirmVariant === 'success') return '✅';
    return 'ℹ️';
  };

  // Detectar modo oscuro
  const isDarkMode = document.body.classList.contains('theme-dark');

  // Colores según el tema
  const getThemeColors = () => {
    if (isDarkMode) {
      return {
        headerBg: '#2d3748',
        contentBg: '#1a202c',
        titleColor: '#f7fafc',
        textColor: '#e2e8f0',
        cancelBg: '#4a5568',
        cancelColor: '#f7fafc',
        cancelHoverBg: '#2d3748',
        cancelBorder: '#4a5568'
      };
    } else {
      return {
        headerBg: '#f8f9fa',
        contentBg: '#ffffff',
        titleColor: '#2d3748',
        textColor: '#4a5568',
        cancelBg: '#ffffff',
        cancelColor: '#4a5568',
        cancelHoverBg: '#f7fafc',
        cancelBorder: '#e2e8f0'
      };
    }
  };

  const colors = getThemeColors();

  return (
    <div 
      className="modal fade show" 
      style={{ 
        display: 'block', 
        backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(3px)',
        zIndex: 1050
      }}
      tabIndex="-1"
      onClick={onHide}
    >
      <div 
        className="modal-dialog modal-dialog-centered" 
        style={{ maxWidth: '420px' }}
        onClick={e => e.stopPropagation()}
      >
        <div 
          className="modal-content" 
          style={{ 
            border: 'none',
            borderRadius: '16px',
            boxShadow: isDarkMode 
              ? '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
              : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
            backgroundColor: colors.contentBg
          }}
        >
          <div 
            className="modal-header" 
            style={{ 
              backgroundColor: colors.headerBg,
              border: 'none',
              padding: '24px 24px 16px 24px',
              textAlign: 'center'
            }}
          >
            <div style={{ width: '100%' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>
                {getIcon()}
              </div>
              <h5 
                className="modal-title" 
                style={{ 
                  fontSize: '20px',
                  fontWeight: '600',
                  color: colors.titleColor,
                  margin: 0
                }}
              >
                {title}
              </h5>
            </div>
            <button 
              type="button" 
              className={`btn-close ${isDarkMode ? 'btn-close-white' : ''}`}
              onClick={onHide}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                fontSize: '14px'
              }}
            ></button>
          </div>
          <div 
            className="modal-body" 
            style={{ 
              padding: '0 24px 24px 24px',
              textAlign: 'center'
            }}
          >
            <p style={{ 
              fontSize: '16px',
              color: colors.textColor,
              lineHeight: '1.5',
              margin: 0
            }}>
              {message}
            </p>
          </div>
          <div 
            className="modal-footer" 
            style={{ 
              border: 'none',
              padding: '0 24px 24px 24px',
              justifyContent: 'center',
              gap: '12px'
            }}
          >
            <button 
              type="button" 
              className="btn"
              onClick={onHide}
              style={{
                fontSize: '14px',
                fontWeight: '500',
                padding: '12px 24px',
                borderRadius: '8px',
                border: `1px solid ${colors.cancelBorder}`,
                backgroundColor: colors.cancelBg,
                color: colors.cancelColor,
                minWidth: '100px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.target.style.backgroundColor = colors.cancelHoverBg;
              }}
              onMouseLeave={e => {
                e.target.style.backgroundColor = colors.cancelBg;
              }}
            >
              {cancelText}
            </button>
            <button 
              type="button" 
              className={`btn btn-${confirmVariant}`}
              onClick={onConfirm}
              style={{
                fontSize: '14px',
                fontWeight: '500',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                minWidth: '100px',
                transition: 'all 0.2s ease',
                boxShadow: confirmVariant === 'danger' 
                  ? '0 4px 6px -1px rgba(239, 68, 68, 0.3)' 
                  : '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
