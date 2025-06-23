import React, { useState } from 'react';
import { API_BASE_URL } from '../assets/Configuration/config';
import CloudinaryUpload from '../components/CloudinaryUpload';
import { useNavigate } from 'react-router-dom';

const NewsEditorPage = ({ language }) => {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [mainImage, setMainImage] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleMainImageUpload = (url) => {
    setMainImage(url);
  };

  const handleImagesUpload = (urls) => {
    setImages(prev => [...prev, ...(Array.isArray(urls) ? urls : [urls])]);
  };

  const handleRemoveImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!title || !summary || !content || !mainImage) {
      setError(language === 'en'
        ? 'All fields and the main image are required.'
        : 'Todos los campos y la imagen principal son obligatorios.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          summary,
          content,
          mainImage,
          images
        })
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || (language === 'en' ? 'Error publishing news' : 'Error al publicar la noticia'));
        setLoading(false);
        return;
      }
      navigate('/news');
    } catch (err) {
      setError(language === 'en' ? 'Error publishing news' : 'Error al publicar la noticia');
    }
    setLoading(false);
  };

  return (
    <div className="container" style={{ maxWidth: 700, marginTop: 32 }}>
      <h2>{language === 'en' ? 'Publish News' : 'Publicar Noticia'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label className="form-label">{language === 'en' ? 'Title' : 'Título'}</label>
          <input className="form-control" value={title} onChange={e => setTitle(e.target.value)} required />
        </div>
        <div className="mb-2">
          <label className="form-label">{language === 'en' ? 'Summary' : 'Resumen'}</label>
          <input className="form-control" value={summary} onChange={e => setSummary(e.target.value)} required />
        </div>
        <div className="mb-2">
          <label className="form-label">{language === 'en' ? 'Content' : 'Contenido'}</label>
          <textarea className="form-control" rows={6} value={content} onChange={e => setContent(e.target.value)} required />
        </div>
        <div className="mb-2">
          <label className="form-label">{language === 'en' ? 'Main Image (required)' : 'Imagen Principal (obligatoria)'}</label>
          <CloudinaryUpload onUpload={handleMainImageUpload} multiple={false} />
          {mainImage && (
            <div style={{ marginTop: 8 }}>
              <img src={mainImage} alt="main" style={{ maxWidth: 200 }} />
            </div>
          )}
        </div>
        <div className="mb-2">
          <label className="form-label">{language === 'en' ? 'Additional Images (optional)' : 'Imágenes adicionales (opcional)'}</label>
          <CloudinaryUpload onUpload={handleImagesUpload} multiple={true} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            {images.map((img, idx) => (
              <div key={idx} style={{ position: 'relative', display: 'inline-block' }}>
                <img src={img} alt={`img${idx}`} style={{ maxWidth: 120, borderRadius: 4 }} />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    background: '#e53935',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: 22,
                    height: 22,
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                  title={language === 'en' ? 'Remove' : 'Eliminar'}
                >×</button>
              </div>
            ))}
          </div>
        </div>
        {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? (language === 'en' ? 'Publishing...' : 'Publicando...') : (language === 'en' ? 'Publish' : 'Publicar')}
        </button>
      </form>
    </div>
  );
};

export default NewsEditorPage;
