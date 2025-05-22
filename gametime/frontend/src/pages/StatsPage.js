import React from 'react';

const StatsPage = ({ language }) => {
  return (
    <div className="container">
      <h2>{language === 'en' ? 'Statistics' : 'Estadísticas'}</h2>
      {/* Aquí puedes mostrar un mensaje o dejarlo vacío si no hay datos */}
      <div className="alert alert-info">
        {language === 'en'
          ? 'No statistics data available.'
          : 'No hay datos de estadísticas disponibles.'}
      </div>
    </div>
  );
};

export default StatsPage;
