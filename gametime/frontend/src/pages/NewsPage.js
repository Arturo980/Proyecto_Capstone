import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../assets/Configuration/config';
import { useNavigate } from 'react-router-dom';

const NewsPage = ({ language }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState(null);
  const navigate = useNavigate();

  // Detecta si el usuario es editor o admin
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null;
    } catch {
      return null;
    }
  })();
  const canAddNews = user && (user.tipoCuenta === 'content-editor' || user.esAdmin);

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

  return (
    <div className="container" style={{ maxWidth: 1200, marginTop: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>{language === 'en' ? 'News' : 'Noticias'}</h2>
        {canAddNews && (
          <button
            className="btn btn-success"
            onClick={() => navigate('/news/add')}
          >
            {language === 'en' ? 'Add News' : 'Agregar Noticia'}
          </button>
        )}
      </div>
      {loading ? (
        <div>{language === 'en' ? 'Loading...' : 'Cargando...'}</div>
      ) : news.length === 0 ? (
        <div>{language === 'en' ? 'No news available.' : 'No hay noticias.'}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'row', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Lista de noticias */}
          <div style={{ flex: '1 1 320px', minWidth: 280 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
              {news.map(noticia => (
                <div
                  key={noticia._id}
                  style={{
                    width: 270,
                    border: selectedNews && selectedNews._id === noticia._id ? '2px solid #007bff' : '1px solid #ccc',
                    borderRadius: 8,
                    padding: 12,
                    background: '#fff',
                    cursor: 'pointer',
                    boxShadow: selectedNews && selectedNews._id === noticia._id ? '0 0 8px #007bff33' : 'none'
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
                  <h5 style={{ marginBottom: 6 }}>{noticia.title}</h5>
                  <div style={{ color: '#888', fontSize: 14, marginBottom: 8 }}>{noticia.summary}</div>
                  {canAddNews && (
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={e => { e.stopPropagation(); navigate(`/news/${noticia._id}/edit`); }}
                    >
                      {language === 'en' ? 'Edit' : 'Editar'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          {/* Previsualización de la noticia seleccionada */}
          <div
            style={{
              flex: '2 1 400px',
              minWidth: 320,
              background: '#f9f9f9',
              borderRadius: 10,
              padding: 24,
              boxShadow: '0 2px 8px #0001',
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
                <h3 style={{ marginBottom: 8 }}>{selectedNews.title}</h3>
                <div style={{ color: '#888', fontSize: 16, marginBottom: 12 }}>{selectedNews.summary}</div>
                <div style={{ fontSize: 17, marginBottom: 12, whiteSpace: 'pre-line' }}>{selectedNews.content}</div>
                {selectedNews.images && selectedNews.images.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 8 }}>{language === 'en' ? 'Gallery:' : 'Galería:'}</div>
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
              <div style={{ color: '#888', fontSize: 16 }}>
                {language === 'en'
                  ? 'Select a news item to preview it here.'
                  : 'Selecciona una noticia para previsualizarla aquí.'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsPage;
