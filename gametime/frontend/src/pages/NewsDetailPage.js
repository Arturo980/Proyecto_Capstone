import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../assets/Configuration/config';
import { useParams, useNavigate } from 'react-router-dom';

const NewsDetailPage = ({ language }) => {
  const { id } = useParams();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Detecta si el usuario es editor o admin
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null;
    } catch {
      return null;
    }
  })();
  const canEditOrDelete = user && (user.tipoCuenta === 'content-editor' || user.esAdmin);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/news/${id}`)
      .then(res => res.json())
      .then(data => setNews(data))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm(language === 'en'
      ? 'Are you sure you want to delete this news?'
      : '¿Estás seguro de que deseas eliminar esta noticia?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/news/${id}`, { method: 'DELETE' });
      if (res.ok) {
        navigate('/news');
      } else {
        const data = await res.json();
        setError(data.error || (language === 'en' ? 'Error deleting news.' : 'Error al eliminar la noticia.'));
      }
    } catch {
      setError(language === 'en' ? 'Error deleting news.' : 'Error al eliminar la noticia.');
    }
  };

  if (loading) {
    return <div style={{ marginTop: 40, textAlign: 'center' }}>{language === 'en' ? 'Loading...' : 'Cargando...'}</div>;
  }
  if (!news || news.error) {
    return <div style={{ marginTop: 40, textAlign: 'center', color: 'red' }}>{language === 'en' ? 'News not found.' : 'Noticia no encontrada.'}</div>;
  }

  return (
    <div className="container" style={{ maxWidth: 800, marginTop: 40, marginBottom: 40 }}>
      <div
        style={{
          background: '#f9f9f9',
          borderRadius: 12,
          padding: 32,
          boxShadow: '0 2px 12px #0001',
          margin: '0 auto'
        }}
      >
        {canEditOrDelete && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 12 }}>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/news/${id}/edit`)}
            >
              {language === 'en' ? 'Edit' : 'Editar'}
            </button>
            <button
              className="btn btn-danger"
              onClick={handleDelete}
            >
              {language === 'en' ? 'Delete' : 'Eliminar'}
            </button>
          </div>
        )}
        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
        {news.mainImage && (
          <img
            src={news.mainImage}
            alt={news.title}
            style={{ width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: 8, marginBottom: 24 }}
          />
        )}
        <h2 style={{ marginBottom: 12 }}>{news.title}</h2>
        <div style={{ fontSize: 18, marginBottom: 18, whiteSpace: 'pre-line' }}>
          {/* Renderiza el contenido enriquecido */}
          <div dangerouslySetInnerHTML={{ __html: news.content }} />
        </div>
        {news.images && news.images.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 10, fontSize: 16 }}>
              {language === 'en' ? 'Gallery:' : 'Galería:'}
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {news.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`img${idx}`}
                  style={{ maxWidth: 140, maxHeight: 100, borderRadius: 6, border: '1px solid #ccc' }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsDetailPage;

