import { useState } from 'react';
import Carousel from 'react-bootstrap/Carousel';
import '../styles/ControlledCarousel.css';
import eightBitImage from '../assets/images/8bit.png';
import treeImage from '../assets/images/arbollindo.png';
import astronautImage from '../assets/images/astronauta.png';
import texts from '../translations/texts';

function ControlledCarousel({ language }) {
  const [index, setIndex] = useState(0);

  const handleSelect = (selectedIndex) => {
    setIndex(selectedIndex);
  };

  return (
    <Carousel activeIndex={index} onSelect={handleSelect}>
      <Carousel.Item>
        <img
          className="d-block w-100 carousel-image"
          src={eightBitImage}
          alt={texts[language].carousel_news_1 || texts['es'].carousel_news_1}
        />
        <Carousel.Caption>
          <h3>{texts[language].carousel_news_1 || texts['es'].carousel_news_1}</h3>
          <p>{texts[language].carousel_description_1 || texts['es'].carousel_description_1}</p>
        </Carousel.Caption>
      </Carousel.Item>
      <Carousel.Item>
        <img
          className="d-block w-100 carousel-image"
          src={treeImage}
          alt={texts[language].carousel_news_2 || texts['es'].carousel_news_2}
        />
        <Carousel.Caption>
          <h3>{texts[language].carousel_news_2 || texts['es'].carousel_news_2}</h3>
          <p>{texts[language].carousel_description_2 || texts['es'].carousel_description_2}</p>
        </Carousel.Caption>
      </Carousel.Item>
      <Carousel.Item>
        <img
          className="d-block w-100 carousel-image"
          src={astronautImage}
          alt={texts[language].carousel_news_3 || texts['es'].carousel_news_3}
        />
        <Carousel.Caption>
          <h3>{texts[language].carousel_news_3 || texts['es'].carousel_news_3}</h3>
          <p>{texts[language].carousel_description_3 || texts['es'].carousel_description_3}</p>
        </Carousel.Caption>
      </Carousel.Item>
    </Carousel>
  );
}

export default ControlledCarousel;
