import React, { useState, useRef, useEffect } from 'react';
import '../styles/MediaPage.css';
import texts from '../translations/texts';
import CloudinaryUpload from '../components/CloudinaryUpload';
import { API_BASE_URL } from '../assets/Configuration/config.js';

const API_GAMES = `${API_BASE_URL}/api/games`;
const API_MATCH_IMAGES = `${API_BASE_URL}/api/match-images`;

const MediaPage = ({ language }) => {
  // Obtener el rol del usuario desde localStorage
  const [userRole] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user?.esAdmin) return 'admin';
      return user?.tipoCuenta || 'public';
    } catch {
      return 'public';
    }
  });

  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [images, setImages] = useState([]);

  // NUEVO: Estado para URLs de Cloudinary a agregar
  const [cloudinaryUrls, setCloudinaryUrls] = useState([]);

  // Estado para mostrar el formulario de agregar imágenes
  const [showAddImages, setShowAddImages] = useState(false);

  // Modal para ver imagen en tamaño original
  const [modalImage, setModalImage] = useState(null);

  // Modal de confirmación para eliminar imagen
  const [deleteImageId, setDeleteImageId] = useState(null);

  // Cargar partidos al montar
  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    const res = await fetch(API_GAMES);
    const data = await res.json();
    setGames(data.games || []);
  };

  // Obtener imágenes del backend para el partido seleccionado
  const fetchImages = async (gameId) => {
    const res = await fetch(`${API_MATCH_IMAGES}/${gameId}`);
    const data = await res.json();
    setImages(data.images || []);
  };

  // Manejo de selección de partido
  const handleSelectGame = (game) => {
    setSelectedGame(game);
    setShowAddImages(false);
    setCloudinaryUrls([]);
    fetchImages(game._id);
  };

  // NUEVO: Manejo de subida de imágenes a Cloudinary y guardado en backend
  const handleCloudinaryUpload = (urlOrUrls) => {
    // Puede ser string o array
    if (Array.isArray(urlOrUrls)) {
      setCloudinaryUrls(urlOrUrls);
    } else if (urlOrUrls) {
      setCloudinaryUrls([urlOrUrls]);
    }
  };

  // NUEVO: Guardar URLs de Cloudinary en el backend como imágenes del partido
  const handleAddImages = async () => {
    if (!selectedGame || cloudinaryUrls.length === 0) return;
    // Por cada URL, crea una imagen en el backend
    for (const url of cloudinaryUrls) {
      await fetch(`${API_MATCH_IMAGES}/${selectedGame._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
    }
    setShowAddImages(false);
    setCloudinaryUrls([]);
    fetchImages(selectedGame._id);
  };

  // Eliminar imagen (con modal)
  const handleDeleteImage = async (imageId) => {
    setDeleteImageId(imageId);
  };

  const confirmDeleteImage = async () => {
    if (deleteImageId) {
      await fetch(`${API_MATCH_IMAGES}/${deleteImageId}`, { method: 'DELETE' });
      if (selectedGame) fetchImages(selectedGame._id);
      setDeleteImageId(null);
    }
  };

  const cancelDeleteImage = () => setDeleteImageId(null);

  // Render para todos los usuarios (público y autenticados)
  return (
    <div className="media-page container mt-5">
      <h1>{language === 'en' ? 'Match Images' : 'Imágenes de Partidos'}</h1>
      {!selectedGame ? (
        <div className="row">
          {games.map((game, idx) => (
            <div
              key={game._id || idx}
              className="col-md-6 match-card d-flex align-items-center justify-content-center mb-4"
              onClick={() => handleSelectGame(game)}
              style={{ cursor: 'pointer' }}
            >
              <div>
                <div style={{ fontWeight: 'bold', fontSize: 18 }}>
                  {game.team1} {texts[language]?.vs || 'vs'} {game.team2}
                </div>
                <div style={{ fontSize: 15, color: '#555' }}>
                  {game.date} - {game.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <button
            className="btn btn-secondary back-button mb-4"
            onClick={() => setSelectedGame(null)}
          >
            {language === 'en' ? 'Back to Games' : 'Volver a Partidos'}
          </button>
          <h3>
            {selectedGame.date} - {selectedGame.team1} {texts[language]?.vs || 'vs'} {selectedGame.team2}
          </h3>
          {/* Solo editores/admin pueden agregar/eliminar imágenes */}
          {(userRole === 'content-editor' || userRole === 'admin') && (
            <div className="d-flex mb-3" style={{ gap: 12 }}>
              {!showAddImages ? (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowAddImages(true)}
                >
                  {language === 'en' ? 'Add Images' : 'Agregar Imágenes'}
                </button>
              ) : (
                <>
                  <button
                    className="btn btn-success"
                    onClick={handleAddImages}
                    disabled={cloudinaryUrls.length === 0}
                  >
                    {language === 'en' ? 'Add' : 'Agregar'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowAddImages(false);
                      setCloudinaryUrls([]);
                    }}
                  >
                    {language === 'en' ? 'Cancel' : 'Cancelar'}
                  </button>
                </>
              )}
            </div>
          )}
          {/* NUEVO: Formulario de subida de imágenes a Cloudinary */}
          {(userRole === 'content-editor' || userRole === 'admin') && showAddImages && (
            <div className="mb-4">
              <label className="form-label">
                {language === 'en'
                  ? 'Upload one or more images (Cloudinary)'
                  : 'Sube una o más imágenes (Cloudinary)'}
              </label>
              <CloudinaryUpload onUpload={handleCloudinaryUpload} multiple />
              {cloudinaryUrls.length > 0 && (
                <div className="mt-2">
                  <strong>{language === 'en' ? 'Images to add:' : 'Imágenes a agregar:'}</strong>
                  <div className="d-flex flex-wrap" style={{ gap: 10 }}>
                    {cloudinaryUrls.map((url, idx) => (
                      <img key={idx} src={url} alt="" style={{ maxWidth: 120, maxHeight: 120, objectFit: 'cover' }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Renderiza las imágenes usando la URL del backend o Cloudinary */}
          <div className="row">
            {images.map((image, idx) => (
              <div key={idx} className="col-md-4 d-flex flex-column align-items-center">
                <img
                  src={
                    image.url.startsWith('http')
                      ? image.url
                      : `http://localhost:3001${image.url}`
                  }
                  alt=""
                  className="img-fluid rounded mb-3"
                  style={{
                    width: '100%',
                    maxWidth: 300,
                    height: 200,
                    objectFit: 'cover',
                    cursor: 'pointer',
                    background: '#eee'
                  }}
                  onClick={() => setModalImage(image)}
                />
                {(userRole === 'content-editor' || userRole === 'admin') && (
                  <button
                    className="btn btn-outline-danger btn-sm mt-2"
                    onClick={() => handleDeleteImage(image._id)}
                  >
                    {language === 'en' ? 'Delete' : 'Eliminar'}
                  </button>
                )}
              </div>
            ))}
          </div>
          {/* Modal para ver imagen en tamaño original */}
          {modalImage && (
            <div
              className="modal-overlay"
              style={{ zIndex: 2000, cursor: 'zoom-out' }}
              onClick={() => setModalImage(null)}
            >
              <div
                className="modal-content"
                style={{
                  background: 'transparent',
                  boxShadow: 'none',
                  padding: 0,
                  maxWidth: '90vw',
                  maxHeight: '90vh',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={e => e.stopPropagation()}
              >
                <img
                  src={
                    modalImage.url.startsWith('http')
                      ? modalImage.url
                      : `http://localhost:3001${modalImage.url}`
                  }
                  alt=""
                  style={{
                    maxWidth: '90vw',
                    maxHeight: '80vh',
                    borderRadius: 10,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
                  }}
                />
                <button
                  className="close-button"
                  style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}
                  onClick={() => setModalImage(null)}
                >
                  &times;
                </button>
              </div>
            </div>
          )}
          {/* Modal de confirmación para eliminar imagen */}
          {deleteImageId && (
            <div className="modal-overlay" onClick={cancelDeleteImage}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h4>{language === 'en' ? 'Confirm Deletion' : 'Confirmar Eliminación'}</h4>
                <p>
                  {language === 'en'
                    ? 'Are you sure you want to delete this image?'
                    : '¿Seguro que deseas eliminar esta imagen?'}
                </p>
                <button className="btn btn-danger me-2" onClick={confirmDeleteImage}>
                  {language === 'en' ? 'Delete' : 'Eliminar'}
                </button>
                <button className="btn btn-secondary" onClick={cancelDeleteImage}>
                  {language === 'en' ? 'Cancel' : 'Cancelar'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MediaPage;
