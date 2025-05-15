import React, { useState, useRef } from 'react';
import '../styles/MediaPage.css'; // Usar estilos globales

const MediaPage = ({ language }) => {
  const [selectedMatch, setSelectedMatch] = useState(null);

  // NUEVO: Estado para agregar imágenes
  const [showAddImage, setShowAddImage] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imageAlt, setImageAlt] = useState('');
  const fileInputRef = useRef(null);

  // Datos de ejemplo de imágenes organizadas por partidos
  const [mediaData, setMediaData] = useState([
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
  ]);

  // Función para convertir fechas al formato dd-mm-aaaa
  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  };

  // NUEVO: Manejo de agregar imagen
  const handleAddImage = () => {
    if (!selectedMatch) return;
    let src = imageUrl;
    if (imageFile) {
      // Mostrar preview local (no persistente)
      src = URL.createObjectURL(imageFile);
    }
    if (!src) return;
    const updatedMedia = mediaData.map((match) =>
      match === selectedMatch
        ? {
            ...match,
            images: [...match.images, { src, alt: imageAlt }],
          }
        : match
    );
    setMediaData(updatedMedia);
    setSelectedMatch({
      ...selectedMatch,
      images: [...selectedMatch.images, { src, alt: imageAlt }],
    });
    setShowAddImage(false);
    setImageUrl('');
    setImageFile(null);
    setImageAlt('');
    if (fileInputRef.current) fileInputRef.current.value = '';
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
          {/* NUEVO: Botón para mostrar el formulario de agregar imagen */}
          <button
            className="btn btn-primary mb-3"
            onClick={() => setShowAddImage(!showAddImage)}
          >
            {language === 'en' ? 'Add Image' : 'Agregar Imagen'}
          </button>
          {showAddImage && (
            <div className="mb-4">
              <label className="form-label">
                {language === 'en' ? 'Image Description (alt)' : 'Descripción de la imagen (alt)'}
              </label>
              <input
                type="text"
                className="form-control mb-2"
                value={imageAlt}
                onChange={e => setImageAlt(e.target.value)}
                placeholder={language === 'en' ? 'Description' : 'Descripción'}
              />
              <div className="mb-2">
                <label className="form-label">
                  {language === 'en' ? 'Image URL' : 'URL de la imagen'}
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={imageUrl}
                  onChange={e => {
                    setImageUrl(e.target.value);
                    setImageFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  placeholder={language === 'en' ? 'Paste image URL' : 'Pega la URL de la imagen'}
                />
              </div>
              <div className="mb-2">
                <label className="form-label">
                  {language === 'en' ? 'Or upload image' : 'O sube una imagen'}
                </label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setImageFile(e.target.files[0]);
                      setImageUrl('');
                    }
                  }}
                />
              </div>
              <button className="btn btn-success mt-2" onClick={handleAddImage}>
                {language === 'en' ? 'Add' : 'Agregar'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MediaPage;
