import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_BASE_URL } from '../assets/Configuration/config';

const NewsDetailPage = ({ language }) => {
  const { id } = useParams();
  const [news, setNews] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/news/${id}`)
      .then(res => res.json())
      .then(setNews);
  }, [id]);

  if (!news) return <div>Cargando...</div>;

  return (
    <div className="container" style={{ maxWidth: 700 }}>
      <h2>{news.title}</h2>
      <div style={{ color: '#888', marginBottom: 8 }}>{new Date(news.createdAt).toLocaleString()}</div>
      {news.images && news.images.map((img, idx) => (
        <img key={idx} src={img} alt="" style={{ maxWidth: '100%', marginBottom: 12 }} />
      ))}
      <p style={{ fontWeight: 'bold' }}>{news.summary}</p>
      <div>{news.content}</div>
    </div>
  );
};

export default NewsDetailPage;
