import React from 'react';

const NotificationModal = ({ 
  show, 
  onHide, 
  title, 
  message, 
  type = 'info' // 'success', 'error', 'info', 'warning'
}) => {
  if (!show) return null;

  // Detectar modo oscuro
  const isDarkMode = document.body.classList.contains('theme-dark');

  const getTypeColor = () => {
    switch (type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      default: return '#3b82f6';
    }
  };

  const getBgColor = () => {
    if (isDarkMode) {
      switch (type) {
        case 'success': return '#064e3b';
        case 'error': return '#7f1d1d';
        case 'warning': return '#78350f';
        default: return '#1e3a8a';
      }
    } else {
      switch (type) {
        case 'success': return '#f0fdf4';
        case 'error': return '#fef2f2';
        case 'warning': return '#fffbeb';
        default: return '#eff6ff';
      }
    }
  };

  const getContentBg = () => {
    return isDarkMode ? '#1a202c' : '#ffffff';
  };

  const getTitleColor = () => {
    if (isDarkMode) {
      switch (type) {
        case 'success': return '#34d399';
        case 'error': return '#f87171';
        case 'warning': return '#fbbf24';
        default: return '#60a5fa';
      }
    } else {
      return getTypeColor();
    }
  };

  const getTextColor = () => {
    return isDarkMode ? '#e2e8f0' : '#4a5568';
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

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
            backgroundColor: getContentBg()
          }}
        >
          <div 
            className="modal-header" 
            style={{ 
              backgroundColor: getBgColor(),
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
                  color: getTitleColor(),
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
              color: getTextColor(),
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
              justifyContent: 'center'
            }}
          >
            <button 
              type="button" 
              className="btn"
              onClick={onHide}
              style={{
                fontSize: '14px',
                fontWeight: '500',
                padding: '12px 32px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: getTypeColor(),
                color: '#ffffff',
                minWidth: '120px',
                transition: 'all 0.2s ease',
                boxShadow: `0 4px 6px -1px ${getTypeColor()}30`
              }}
              onMouseEnter={e => {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = `0 6px 8px -1px ${getTypeColor()}40`;
              }}
              onMouseLeave={e => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = `0 4px 6px -1px ${getTypeColor()}30`;
              }}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
