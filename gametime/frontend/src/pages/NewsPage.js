import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../assets/Configuration/config';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';
import NotificationModal from '../components/NotificationModal';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import texts from '../translations/texts';
import '../styles/NewsPage.css';

const NewsPage = ({ language }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [newsToDelete, setNewsToDelete] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState({ title: '', message: '', type: 'info' });
  const navigate = useNavigate();

  // Detecta si el usuario puede editar/eliminar noticias (solo admin y content-editor)
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null;
    } catch {
      return null;
    }
  })();
  const canEditNews = user && (user.tipoCuenta === 'content-editor' || user.esAdmin);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/news`)
      .then(res => res.json())
      .then(data => setNews(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  // Cuando cambia la lista de noticias, selecciona la primera por defecto
  useEffect(() => {
    if (news.length > 0 && !selectedNews) {
      setSelectedNews(news[0]);
    }
  }, [news, selectedNews]);

  const handleSelectNews = noticia => {
    setSelectedNews(noticia);
  };

  const handleDeleteNews = async (newsId, newsTitle) => {
    setNewsToDelete({ id: newsId, title: newsTitle });
    setShowConfirmModal(true);
  };

  const confirmDeleteNews = async () => {
    if (!newsToDelete) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/news/${newsToDelete.id}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        // Actualizar la lista de noticias
        setNews(prev => prev.filter(n => n._id !== newsToDelete.id));
        // Si la noticia eliminada era la seleccionada, seleccionar otra
        if (selectedNews && selectedNews._id === newsToDelete.id) {
          const remainingNews = news.filter(n => n._id !== newsToDelete.id);
          setSelectedNews(remainingNews.length > 0 ? remainingNews[0] : null);
        }
        
        // Mostrar notificación de éxito
        setNotification({
          title: texts[language].success,
          message: texts[language].news_deleted_successfully,
          type: 'success'
        });
        setShowNotification(true);
      } else {
        const data = await res.json();
        setNotification({
          title: texts[language].error,
          message: data.error || texts[language].error_deleting_news,
          type: 'error'
        });
        setShowNotification(true);
      }
    } catch (err) {
      setNotification({
        title: texts[language].error,
        message: texts[language].error_deleting_news,
        type: 'error'
      });
      setShowNotification(true);
    }
    
    setShowConfirmModal(false);
    setNewsToDelete(null);
  };

  return (
    <div className="full-page-container">
      <div className="container news-container" style={{ maxWidth: 1200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>{texts[language].news}</h2>
        {canEditNews && (
          <button
            className="btn btn-success"
            onClick={() => navigate('/news/add')}
          >
            {texts[language].add_news}
          </button>
        )}
      </div>
      {loading ? (
        <LoadingSpinner />
      ) : news.length === 0 ? (
        <EmptyState 
          icon="📰"
          title={language === 'en' ? 'No News Available' : 'No hay noticias disponibles'}
          description={language === 'en' 
            ? 'No news articles have been published yet. Check back later for updates.' 
            : 'Aún no se han publicado noticias. Vuelve más tarde para ver actualizaciones.'
          }
          actionText={canEditNews ? (language === 'en' ? 'Create First News' : 'Crear primera noticia') : null}
          onAction={canEditNews ? () => navigate('/news/new') : null}
          language={language}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'row', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Lista de noticias */}
          <div style={{ flex: '1 1 320px', minWidth: 280 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
              {news.map(noticia => (
                <div
                  key={noticia._id}
                  className={`news-card ${selectedNews && selectedNews._id === noticia._id ? 'selected' : ''}`}
                  style={{
                    width: 270,
                    padding: 12,
                    cursor: 'pointer'
                  }}
                  onClick={() => handleSelectNews(noticia)}
                >
                  {noticia.mainImage && (
                    <img
                      src={noticia.mainImage}
                      alt={noticia.title}
                      style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 6, marginBottom: 8 }}
                    />
                  )}
                  <h5 className="news-title" style={{ marginBottom: 6 }}>{noticia.title}</h5>
                  {/* El resumen solo debe mostrarse en el carrusel, así que lo quitamos aquí */}
                  {canEditNews && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={e => { e.stopPropagation(); navigate(`/news/${noticia._id}/edit`); }}
                      >
                        {texts[language].edit}
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={e => { 
                          e.stopPropagation(); 
                          handleDeleteNews(noticia._id, noticia.title); 
                        }}
                      >
                        {texts[language].delete}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          {/* Previsualización de la noticia seleccionada */}
          <div
            className="news-preview"
            style={{
              flex: '2 1 400px',
              minWidth: 320,
              borderRadius: 10,
              padding: 24,
              marginTop: 0,
              maxWidth: 600
            }}
          >
            {selectedNews ? (
              <div>
                {selectedNews.mainImage && (
                  <img
                    src={selectedNews.mainImage}
                    alt={selectedNews.title}
                    style={{ width: '100%', maxHeight: 260, objectFit: 'cover', borderRadius: 8, marginBottom: 16 }}
                  />
                )}
                <h3 className="news-title" style={{ marginBottom: 8 }}>{selectedNews.title}</h3>
                {/* El resumen se elimina de la previsualización */}
                <div className="news-content" style={{ fontSize: 17, marginBottom: 12, whiteSpace: 'pre-line' }}>
                  <div dangerouslySetInnerHTML={{ __html: selectedNews.content }} />
                </div>
                {selectedNews.images && selectedNews.images.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 8 }}>{texts[language].gallery}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {selectedNews.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`img${idx}`}
                          style={{ maxWidth: 120, maxHeight: 90, borderRadius: 4, border: '1px solid #ccc' }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="news-placeholder" style={{ fontSize: 16 }}>
                {texts[language].select_news_to_preview}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Modal de confirmación para eliminar */}
      <ConfirmModal
        show={showConfirmModal}
        onHide={() => {
          setShowConfirmModal(false);
          setNewsToDelete(null);
        }}
        onConfirm={confirmDeleteNews}
        title={texts[language].delete_news}
        message={
          newsToDelete 
            ? `${texts[language].confirm_delete_news} "${newsToDelete.title}"?`
            : ''
        }
        confirmText={texts[language].delete}
        cancelText={texts[language].cancel}
        confirmVariant="danger"
      />

      {/* Modal de notificación */}
      <NotificationModal
        show={showNotification}
        onHide={() => setShowNotification(false)}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />
      </div>
    </div>
  );
};

export default NewsPage;
