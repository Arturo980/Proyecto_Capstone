import React, { useRef, useState, useEffect } from 'react';
import '../styles/HorizontalCarousel.css';
import leftArrowImage from '../assets/images/flecha-izquierda.png';
import rightArrowImage from '../assets/images/flecha-correcta.png';

const HorizontalGamesCarousel = ({ games, language }) => {
  const carouselRef = useRef(null);
  const [showButtons, setShowButtons] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Utilidad para saber si el partido está en vivo
  const isLive = (game) =>
    !game.partidoFinalizado && game.citados && game.citados.trim() !== '';

  // Utilidad para saber si el partido está finalizado
  const isFinished = (game) => !!game.partidoFinalizado;

  // Utilidad para saber si el partido aún no empieza
  const isPending = (game) =>
    !game.partidoFinalizado && (!game.citados || game.citados.trim() === '');

  // Utilidad para obtener el estado textual
  const getStatusText = (game) => {
    if (isLive(game)) return language === 'en' ? 'Live' : 'En vivo';
    if (isFinished(game)) return language === 'en' ? 'Final' : 'Finalizado';
    return language === 'en' ? 'Scheduled' : 'Programado';
  };

  // Utilidad para obtener el canal (si existe)
  const getChannel = (game) => game.channel || '';

  // Utilidad para obtener el marcador
  const getScore = (game) => ({
    score1: typeof game.score1 === 'number' ? game.score1 : '-',
    score2: typeof game.score2 === 'number' ? game.score2 : '-'
  });

  // Utilidad para obtener nombre corto (si existe)
  const getShortName = (team, game) => {
    // Si tienes un campo shortName, úsalo. Si no, usa el nombre.
    return team;
  };

  // Utilidad para obtener logo (si existe)
  const getLogo = (team, game) => {
    // Si tienes un campo logo, úsalo. Si no, retorna null.
    return null;
  };

  // Utilidad para saber si el equipo ganó
  const isWinner = (game, teamIndex) => {
    if (!isFinished(game)) return false;
    const { score1, score2 } = getScore(game);
    if (score1 === '-' || score2 === '-') return false;
    if (teamIndex === 1) return score1 > score2;
    if (teamIndex === 2) return score2 > score1;
    return false;
  };

  const handleScroll = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };

  const handleScrollRight = () => {
    if (carouselRef.current) {
      const card = carouselRef.current.querySelector('.game-card');
      if (!card) return;
      const cardWidth = card.offsetWidth;
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      const maxScrollLeft = scrollWidth - clientWidth;

      if (scrollLeft + cardWidth <= maxScrollLeft) {
        carouselRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' });
      } else {
        carouselRef.current.scrollTo({ left: maxScrollLeft, behavior: 'smooth' });
      }
    }
  };

  const handleScrollLeft = () => {
    if (carouselRef.current) {
      const card = carouselRef.current.querySelector('.game-card');
      if (!card) return;
      const cardWidth = card.offsetWidth;
      const { scrollLeft } = carouselRef.current;

      if (scrollLeft - cardWidth >= 0) {
        carouselRef.current.scrollBy({ left: -cardWidth, behavior: 'smooth' });
      } else {
        carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.scrollTo({ left: 0 });
      carousel.addEventListener('scroll', handleScroll);
      handleScroll();
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
      onMouseEnter={() => setShowButtons(true)}
      onMouseLeave={() => setShowButtons(false)}
    >
      <div className="horizontal-carousel">
        {canScrollLeft && showButtons && (
          <button className="scroll-left-button" onClick={handleScrollLeft}>
            <img src={leftArrowImage} alt="Scroll Left" className="arrow-icon" />
          </button>
        )}
        <div className="carousel-track-container" ref={carouselRef}>
          <div className="carousel-track">
            {games && games.length > 0 ? (
              games.map((game, index) => {
                const team1 = game.team1;
                const team2 = game.team2;
                const { score1, score2 } = getScore(game);
                return (
                  <div key={game._id || index} className="game-card">
                    {/* Estado y canal */}
                    <div className="game-status-row">
                      {isLive(game) && (
                        <span className="game-status-live-dot" />
                      )}
                      <span
                        className="game-status-text"
                        style={{
                          color: isLive(game) ? '#e53935' : isFinished(game) ? '#007bff' : '#888',
                          fontWeight: isLive(game) ? 700 : 500,
                        }}
                      >
                        {getStatusText(game).toUpperCase()}
                      </span>
                      {getChannel(game) && (
                        <span className="game-status-channel">
                          {getChannel(game)}
                        </span>
                      )}
                    </div>
                    {/* Equipos y marcador */}
                    <div className="game-teams-block">
                      {/* Visitante (arriba) */}
                      <div className="game-team-row">
                        {/* Logo opcional */}
                        {/* {getLogo(team1, game) && <img src={getLogo(team1, game)} alt={team1} className="game-team-logo" />} */}
                        <span className={`game-team-name${isWinner(game, 1) ? ' winner' : ''}`}>
                          {getShortName(team1, game)}
                        </span>
                        <span className="game-score">
                          {score1}
                        </span>
                      </div>
                      {/* Local (abajo) */}
                      <div className="game-team-row">
                        {/* Logo opcional */}
                        {/* {getLogo(team2, game) && <img src={getLogo(team2, game)} alt={team2} className="game-team-logo" />} */}
                        <span className={`game-team-name${isWinner(game, 2) ? ' winner' : ''}`}>
                          {getShortName(team2, game)}
                        </span>
                        <span className="game-score">
                          {score2}
                        </span>
                      </div>
                    </div>
                    {/* Hora abajo si está programado */}
                    {isPending(game) && (
                      <div className="game-time-row">
                        {game.time}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="no-games-message" style={{ padding: 24, textAlign: 'center', color: '#888', fontWeight: 'bold' }}>
                {language === 'en' ? 'No games to show.' : 'No hay partidos para mostrar.'}
              </div>
            )}
          </div>
        </div>
        {canScrollRight && showButtons && (
          <button className="scroll-right-button" onClick={handleScrollRight}>
            <img src={rightArrowImage} alt="Scroll Right" className="arrow-icon" />
          </button>
        )}
      </div>
    </div>
  );
};

export default HorizontalGamesCarousel;
