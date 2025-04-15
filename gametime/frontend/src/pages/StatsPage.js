import React from 'react';
import statsData from '../data/statsData'; // Datos de estadísticas

const StatsPage = ({ language }) => {
  return (
    <div className="container mt-5">
      <h2>{language === 'en' ? 'Statistics' : 'Estadísticas'}</h2>
      <div className="row">
        {statsData.map((stat, index) => (
          <div key={index} className="col-md-4 mb-3">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">{stat.title[language]}</h5>
                <p className="card-text">{stat.description[language]}</p>
                <ul>
                  {stat.data.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsPage;
