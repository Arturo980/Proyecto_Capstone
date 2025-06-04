import React from 'react';

const spinnerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '40vh',
};

const circleStyle = {
  border: '8px solid #f3f3f3',
  borderTop: '8px solid #007bff',
  borderRadius: '50%',
  width: 64,
  height: 64,
  animation: 'spin 1s linear infinite',
};

const keyframes = `
@keyframes spin {
  0% { transform: rotate(0deg);}
  100% { transform: rotate(360deg);}
}
`;

const LoadingSpinner = () => (
  <div style={spinnerStyle}>
    <style>{keyframes}</style>
    <div style={circleStyle}></div>
  </div>
);

export default LoadingSpinner;
