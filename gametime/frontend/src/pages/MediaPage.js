import React, { useState } from 'react';
import '../styles/MediaPage.css'; // Usar estilos globales

const MediaPage = ({ language }) => {
  const [selectedMatch, setSelectedMatch] = useState(null);

  // Datos de ejemplo de imágenes organizadas por partidos
  const mediaData = [
    {
      date: '2023-11-01',
      match: 'Spikers United vs Block Masters',
      team1Logo: '/images/logos/spikers_united.png',
      team2Logo: '/images/logos/block_masters.png',
      images: [
        { src: '/images/match1/img1.jpg', alt: 'Spikers United celebrando un punto' },
        { src: '/images/match1/img2.jpg', alt: 'Block Masters defendiendo' },
      ],
    },
    {
      date: '2023-11-02',
      match: 'Ace Warriors vs Net Crushers',
      team1Logo: '/images/logos/ace_warriors.png',
      team2Logo: '/images/logos/net_crushers.png',
      images: [
        { src: '/images/match2/img1.jpg', alt: 'Ace Warriors en acción' },
        { src: '/images/match2/img2.jpg', alt: 'Net Crushers bloqueando' },
      ],
    },
  ];

  // Función para convertir fechas al formato dd-mm-aaaa
  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  };

  return (
    <div className="media-page container mt-5">
      <h1>{language === 'en' ? 'Media Gallery' : 'Galería de Medios'}</h1>
      {!selectedMatch ? (
        <div className="row">
          {mediaData.map((match, index) => (
            <div
              key={index}
              className="col-md-6 match-card d-flex align-items-center justify-content-center mb-4"
              onClick={() => setSelectedMatch(match)}
              style={{ cursor: 'pointer' }}
            >
              <img
                src={match.team1Logo}
                alt={match.match.split(' vs ')[0]}
                className="img-fluid team-logo me-3"
                style={{ maxWidth: '100px' }}
              />
              <img
                src={match.team2Logo}
                alt={match.match.split(' vs ')[1]}
                className="img-fluid team-logo"
                style={{ maxWidth: '100px' }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div>
          <button
            className="btn btn-secondary back-button mb-4"
            onClick={() => setSelectedMatch(null)}
          >
            {language === 'en' ? 'Back to Matches' : 'Volver a los Partidos'}
          </button>
          <h3>{formatDate(selectedMatch.date)} - {selectedMatch.match}</h3>
          <div className="row">
            {selectedMatch.images.map((image, idx) => (
              <div key={idx} className="col-md-4">
                <img src={image.src} alt={image.alt} className="img-fluid rounded mb-3" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaPage;
