import React, { useEffect, useState } from "react";
import "../styles/HorizontalCarousel.css";
import { API_BASE_URL } from "../assets/Configuration/config.js";

const LEAGUES_URL = `${API_BASE_URL}/api/leagues`;
const GAMES_URL = `${API_BASE_URL}/api/games`;

const HorizontalGamesCarousel = () => {
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState("");
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar ligas al montar
  useEffect(() => {
    fetch(LEAGUES_URL)
      .then((res) => res.json())
      .then((data) => {
        setLeagues(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0)
          setSelectedLeague(data[0]._id);
      });
  }, []);

  // Cargar todos los partidos de la liga seleccionada
  useEffect(() => {
    if (!selectedLeague) return;
    setLoading(true);
    fetch(`${GAMES_URL}?league=${selectedLeague}`)
      .then((res) => res.json())
      .then((data) => {
        // El backend responde { games: [...] }
        setGames(Array.isArray(data.games) ? data.games : []);
        setLoading(false);
      })
      .catch(() => {
        setGames([]);
        setLoading(false);
      });
  }, [selectedLeague]);

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="carousel-container">
      <div className="carousel-title">
        <span>Resultados</span>
        <select
          className="carousel-dropdown"
          value={selectedLeague}
          onChange={(e) => setSelectedLeague(e.target.value)}
        >
          {leagues.map((l) => (
            <option key={l._id} value={l._id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>
      <div className="carousel-scroll">
        {games.length === 0 ? (
          <div style={{ color: "#fff", padding: 16 }}>
            No hay partidos para esta liga.
          </div>
        ) : (
          games.map((game, idx) => (
            <div className="game-card" key={idx}>
              <div className="teams">
                <div className="team">
                  <span>{game.team1_abbr}</span>
                </div>
                <div className="team">
                  <span>{game.team2_abbr}</span>
                </div>
              </div>
              <div className="game-date">
                {game.date} {game.time}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HorizontalGamesCarousel;
