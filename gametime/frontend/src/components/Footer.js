import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import tiktokLogo from '../assets/images/tik-tok.png'; // Import TikTok logo
import instagramLogo from '../assets/images/instagram.png'; // Import Instagram logo
import texts from '../translations/texts'; // Importar textos para traducción

const Footer = ({ language }) => {
  return (
    <footer className="bg-dark text-white text-center py-3">
      <div className="container">
        <p>&copy; 2025 Gametime. {texts[language]?.footer_rights || texts.en.footer_rights}</p>
        <p>
          {texts[language]?.footer_follow_us || texts.en.footer_follow_us}
          <a href="https://www.instagram.com/gametimechile?igsh=bzdodGtycnA2d2Y4" className="text-white mx-2">
            <img src={instagramLogo} alt="Instagram" style={{ width: '24px', height: '24px', marginLeft: '8px' }} />
          </a>
          <a href="https://www.tiktok.com/@gametimechile?fbclid=PAQ0xDSwKGM6BleHRuA2FlbQIxMQABp1_trdu-aspPwUD-GFluktkqrC4OueJNOuTG7ZiGB4kG7Q_AIWjQloAWDKIC_aem_7jwPUK_ZEPE16HprldsNjw" className="text-white mx-2">
            <img src={tiktokLogo} alt="TikTok" style={{ width: '24px', height: '24px', marginLeft: '8px' }} />
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
