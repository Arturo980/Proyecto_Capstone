import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Carousel from 'react-bootstrap/Carousel';
import { API_BASE_URL } from '../assets/Configuration/config';
import '../styles/ControlledCarousel.css';

function ControlledCarousel({ language }) {
  const [news, setNews] = useState([]);
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/news`)
      .then(res => res.json())
      .then(data => setNews(Array.isArray(data) ? data : []));
  }, []);

  const handleSelect = (selectedIndex) => {
    setIndex(selectedIndex);
  };

  if (!news.length) {
    // Si no hay noticias, muestra el carrusel estático antiguo
    return (
      <Carousel activeIndex={index} onSelect={handleSelect}>
        <Carousel.Item>
          <div style={{height: 300, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <h3>No hay noticias disponibles</h3>
          </div>
        </Carousel.Item>
      </Carousel>
    );
  }

  return (
    <Carousel activeIndex={index} onSelect={handleSelect}>
      {news.map(noticia => (
        <Carousel.Item key={noticia._id} onClick={() => navigate(`/news/${noticia._id}`)} style={{ cursor: 'pointer' }}>
          {noticia.mainImage && (
            <img
              className="d-block w-100 carousel-image"
              src={noticia.mainImage}
              alt={noticia.title}
              style={{ maxHeight: 400, objectFit: 'cover' }}
            />
          )}
          <Carousel.Caption>
            <h3>{noticia.title}</h3>
            <p>{noticia.summary}</p>
          </Carousel.Caption>
        </Carousel.Item>
      ))}
    </Carousel>
  );
}

export default ControlledCarousel;
