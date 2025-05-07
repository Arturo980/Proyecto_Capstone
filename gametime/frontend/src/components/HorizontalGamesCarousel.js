import React, { useRef, useState, useEffect } from 'react';
import '../styles/HorizontalCarousel.css'; // Importar estilos específicos del carrusel
import leftArrowImage from '../assets/images/flecha-izquierda.png'; // Importar imagen de flecha izquierda
import rightArrowImage from '../assets/images/flecha-correcta.png'; // Importar imagen de flecha derecha

const HorizontalGamesCarousel = ({ games, language }) => {
  const carouselRef = useRef(null);
  const [showButtons, setShowButtons] = useState(false); // Estado para mostrar/ocultar botones
  const [canScrollLeft, setCanScrollLeft] = useState(false); // Estado para habilitar/deshabilitar flecha izquierda
  const [canScrollRight, setCanScrollRight] = useState(true); // Estado para habilitar/deshabilitar flecha derecha

  const formatDate = (dateString) => {
    if (!dateString) return 'Invalid Date'; // Manejar fechas vacías o no definidas

    // Convertir del formato día-mes-año al formato ISO (año-mes-día)
    const [day, month, year] = dateString.split('-');
    const isoDateString = `${year}-${month}-${day}`;
    const date = new Date(isoDateString);

    if (isNaN(date)) return 'Invalid Date'; // Manejar fechas no válidas

    if (language === 'es') {
      return `${day}-${month}-${year}`; // Formato día-mes-año
    } else {
      return `${month}-${day}-${year}`; // Formato mes-día-año
    }
  };

  const handleScroll = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0); // Habilitar flecha izquierda si no está al inicio
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1); // Ajustar cálculo para evitar errores de redondeo
    }
  };

  const handleScrollRight = () => {
    if (carouselRef.current) {
      const cardWidth = carouselRef.current.querySelector('.game-card').offsetWidth; // Obtener el ancho de una tarjeta
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      const maxScrollLeft = scrollWidth - clientWidth; // Máximo desplazamiento permitido

      if (scrollLeft + cardWidth <= maxScrollLeft) { // Verificar si no se excede el límite
        carouselRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' });
      } else {
        carouselRef.current.scrollTo({ left: maxScrollLeft, behavior: 'smooth' }); // Ajustar al límite exacto
      }
    }
  };

  const handleScrollLeft = () => {
    if (carouselRef.current) {
      const cardWidth = carouselRef.current.querySelector('.game-card').offsetWidth; // Obtener el ancho de una tarjeta
      const { scrollLeft } = carouselRef.current;

      if (scrollLeft - cardWidth >= 0) { // Verificar si no se excede el inicio
        carouselRef.current.scrollBy({ left: -cardWidth, behavior: 'smooth' });
      } else {
        carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' }); // Ajustar al inicio exacto
      }
    }
  };

  useEffect(() => {
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.scrollTo({ left: 0 }); // Asegurar que el carrusel comience desde el inicio
      carousel.addEventListener('scroll', handleScroll);
      handleScroll(); // Verificar el estado inicial
    }
    return () => {
      if (carousel) {
        carousel.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  return (
    <div
      className="horizontal-carousel-wrapper"
      onMouseEnter={() => setShowButtons(true)} // Mostrar botones al pasar el ratón
      onMouseLeave={() => setShowButtons(false)} // Ocultar botones al salir el ratón
    >
      <div className="horizontal-carousel">
        {canScrollLeft && showButtons && ( // Mostrar botón izquierdo solo si es necesario
          <button className="scroll-left-button" onClick={handleScrollLeft}>
            <img src={leftArrowImage} alt="Scroll Left" className="arrow-icon" />
          </button>
        )}
        <div className="carousel-track-container" ref={carouselRef}>
          <div className="carousel-track">
            {games.map((game, index) => (
              <div key={index} className="game-card">
                <div className="game-teams-scores">
                  <div className="team-row">
                    <span className="team-name">{game.team1}</span>
                    <span className="team-score">{game.status === 'past' || game.status === 'ongoing' ? game.score.split('-')[0] : '-'}</span>
                  </div>
                  <div className="team-row">
                    <span className="team-name">{game.team2}</span>
                    <span className="team-score">{game.status === 'past' || game.status === 'ongoing' ? game.score.split('-')[1] : '-'}</span>
                  </div>
                </div>
                <div className="game-info">
                  <div className="game-date-time">{formatDate(game.date)} - {game.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {canScrollRight && showButtons && ( // Mostrar botón derecho solo si es necesario
          <button className="scroll-right-button" onClick={handleScrollRight}>
            <img src={rightArrowImage} alt="Scroll Right" className="arrow-icon" />
          </button>
        )}
      </div>
    </div>
  );
};

export default HorizontalGamesCarousel;
