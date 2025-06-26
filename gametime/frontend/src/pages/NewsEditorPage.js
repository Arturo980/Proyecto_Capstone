import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../assets/Configuration/config';
import CloudinaryUpload from '../components/CloudinaryUpload';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Función para limpiar HTML y obtener solo texto plano para el resumen
const getSummary = (content) => {
  const tmp = document.createElement('div');
  tmp.innerHTML = content;
  const text = tmp.textContent || tmp.innerText || '';
  return text.replace(/\s+/g, ' ').trim().slice(0, 180) + (text.length > 180 ? '...' : '');
};

const NewsEditorPage = ({ language }) => {
  const { id } = useParams();
  const isEdit = !!id;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mainImage, setMainImage] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialLoad, setInitialLoad] = useState(isEdit);
  const navigate = useNavigate();

  // Cargar noticia si es edición
  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      fetch(`${API_BASE_URL}/api/news/${id}`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          if (data.error) {
            throw new Error(data.error);
          }
          setTitle(data.title || '');
          setContent(data.content || '');
          setMainImage(data.mainImage || '');
          setImages(Array.isArray(data.images) ? data.images : []);
        })
        .catch((err) => {
          console.error('Error loading news:', err);
          setError(language === 'en' ? 'Error loading news.' : 'Error al cargar la noticia.');
        })
        .finally(() => {
          setLoading(false);
          setInitialLoad(false);
        });
    } else {
      setInitialLoad(false);
    }
  }, [isEdit, id, language]);

  const summary = getSummary(content);

  const handleMainImageUpload = (url) => {
    setMainImage(url);
  };

  const handleRemoveMainImage = () => {
    setMainImage('');
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
    if (!title || !content || !mainImage) {
      setError(language === 'en'
        ? 'Title, content and main image are required.'
        : 'Título, contenido e imagen principal son obligatorios.');
      return;
    }
    setLoading(true);
    try {
      const method = isEdit ? 'PUT' : 'POST';
      const url = isEdit
        ? `${API_BASE_URL}/api/news/${id}`
        : `${API_BASE_URL}/api/news`;
      const res = await fetch(url, {
        method,
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
        setError(data.error || (language === 'en' ? 'Error saving news' : 'Error al guardar la noticia'));
        setLoading(false);
        return;
      }
      navigate('/news');
    } catch (err) {
      setError(language === 'en' ? 'Error saving news' : 'Error al guardar la noticia');
    }
    setLoading(false);
  };

  // Configuración de la barra de herramientas de ReactQuill
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link'],
      ['clean']
    ]
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'align', 'blockquote', 'code-block', 'link'
  ];

  if (initialLoad) {
    return (
      <div className="container" style={{ maxWidth: 700, marginTop: 32 }}>
        <div>{language === 'en' ? 'Loading...' : 'Cargando...'}</div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 1200, marginTop: 32 }}>
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        gap: 32,
        alignItems: 'flex-start',
        flexWrap: 'wrap'
      }}>
        {/* Formulario de noticia */}
        <div style={{ flex: '1 1 350px', minWidth: 320, maxWidth: 500 }}>
          <div style={{ marginBottom: 16 }}>
            <button 
              className="btn btn-outline-secondary btn-sm"
              onClick={() => navigate('/news')}
              style={{ marginBottom: 8 }}
            >
              ← {language === 'en' ? 'Back to News' : 'Volver a Noticias'}
            </button>
          </div>
          <h2>
            {isEdit
              ? (language === 'en' ? 'Edit News' : 'Editar Noticia')
              : (language === 'en' ? 'Publish News' : 'Publicar Noticia')}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-2">
              <label className="form-label">{language === 'en' ? 'Title' : 'Título'}</label>
              <input className="form-control" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div className="mb-2">
              <label className="form-label">{language === 'en' ? 'Content' : 'Contenido'}</label>
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                modules={quillModules}
                formats={quillFormats}
                style={{ minHeight: 180, marginBottom: 8, background: '#fff' }}
              />
            </div>
            <div className="mb-2">
              <label className="form-label">{language === 'en' ? 'Main Image (required)' : 'Imagen Principal (obligatoria)'}</label>
              <CloudinaryUpload onUpload={handleMainImageUpload} multiple={false} showPreview={false} />
              {mainImage && (
                <div style={{ marginTop: 8, position: 'relative', display: 'inline-block' }}>
                  <img src={mainImage} alt="main" style={{ maxWidth: 200 }} />
                  <button
                    type="button"
                    onClick={handleRemoveMainImage}
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
                    title={language === 'en' ? 'Remove main image' : 'Eliminar imagen principal'}
                  >×</button>
                </div>
              )}
            </div>
            <div className="mb-2">
              <label className="form-label">{language === 'en' ? 'Additional Images (optional)' : 'Imágenes adicionales (opcional)'}</label>
              <CloudinaryUpload onUpload={handleImagesUpload} multiple={true} showPreview={true} />
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
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading
                  ? (language === 'en'
                    ? (isEdit ? 'Saving...' : 'Publishing...')
                    : (isEdit ? 'Guardando...' : 'Publicando...'))
                  : (language === 'en'
                    ? (isEdit ? 'Save' : 'Publish')
                    : (isEdit ? 'Guardar' : 'Publicar'))}
              </button>
              <button 
                className="btn btn-secondary" 
                type="button" 
                onClick={() => navigate('/news')}
                disabled={loading}
              >
                {language === 'en' ? 'Cancel' : 'Cancelar'}
              </button>
            </div>
          </form>
        </div>
        {/* Previsualización */}
        <div
          style={{
            flex: '1 1 350px',
            minWidth: 320,
            background: '#f9f9f9',
            borderRadius: 10,
            padding: 24,
            boxShadow: '0 2px 8px #0001',
            marginTop: 0,
            maxWidth: 600
          }}
        >
          <h4 style={{ marginBottom: 16, color: '#333' }}>
            {language === 'en' ? 'Preview' : 'Previsualización'}
          </h4>
          {mainImage && (
            <img
              src={mainImage}
              alt="preview"
              style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 8, marginBottom: 16 }}
            />
          )}
          <h3 style={{ marginBottom: 8 }}>{title || <span style={{ color: '#bbb' }}>{language === 'en' ? 'Title...' : 'Título...'}</span>}</h3>
          <div style={{ fontSize: 17, marginBottom: 12, whiteSpace: 'pre-line' }}>
            {/* Renderiza el contenido enriquecido */}
            <div dangerouslySetInnerHTML={{ __html: content || `<span style="color:#ccc">${language === 'en' ? 'Content...' : 'Contenido...'}</span>` }} />
          </div>
          {images && images.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 8 }}>{language === 'en' ? 'Gallery:' : 'Galería:'}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`img${idx}`}
                    style={{ maxWidth: 100, maxHeight: 80, borderRadius: 4, border: '1px solid #ccc' }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsEditorPage;
