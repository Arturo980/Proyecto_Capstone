import React, { useState, useRef, useEffect } from 'react';
import '../styles/MediaPage.css';
import texts from '../translations/texts';

const API_GAMES = process.env.REACT_APP_API_GAMES_URL || 'http://localhost:3001/api/games';
const API_MATCH_IMAGES = process.env.REACT_APP_API_MATCH_IMAGES_URL || 'http://localhost:3001/api/match-images';

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

  // Estado para imágenes (solo frontend, no persistente)
  const [showAddImages, setShowAddImages] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const fileInputRef = useRef(null);

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
    setImageFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Cargar imágenes del partido seleccionado
    fetchImages(game._id);
  };

  // Manejo de agregar imágenes usando Multer/Express (subida al backend)
  const handleAddImages = async () => {
    if (!selectedGame || imageFiles.length === 0) return;
    const formData = new FormData();
    Array.from(imageFiles).forEach(file => formData.append('images', file));
    // No se agregan descripciones
    await fetch(`${API_MATCH_IMAGES}/${selectedGame._id}`, {
      method: 'POST',
      body: formData,
    });
    setShowAddImages(false);
    setImageFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
                  >
                    {language === 'en' ? 'Add' : 'Agregar'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowAddImages(false);
                      setImageFiles([]);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    {language === 'en' ? 'Cancel' : 'Cancelar'}
                  </button>
                </>
              )}
            </div>
          )}
          {/* Formulario de subida de imágenes solo para editores/admin */}
          {(userRole === 'content-editor' || userRole === 'admin') && showAddImages && (
            <div className="mb-4">
              <label className="form-label">
                {language === 'en'
                  ? 'Select one or more images'
                  : 'Selecciona una o más imágenes'}
              </label>
              <input
                type="file"
                className="form-control mb-2"
                accept="image/*"
                multiple
                ref={fileInputRef}
                onChange={e => {
                  setImageFiles(e.target.files ? Array.from(e.target.files) : []);
                }}
              />
              {imageFiles.length > 0 && (
                <div>
                  {Array.from(imageFiles).map((file, idx) => (
                    <div key={idx} className="mb-2">
                      <img
                        src={URL.createObjectURL(file)}
                        alt=""
                        style={{ maxWidth: 120, marginRight: 8, marginBottom: 4 }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* Renderiza las imágenes usando la URL del backend */}
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
