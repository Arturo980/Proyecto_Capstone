import React, { useEffect, useState } from "react";
import "../styles/HorizontalCarousel.css";
import { API_BASE_URL } from "../assets/Configuration/config.js";

const LEAGUES_URL = `${API_BASE_URL}/api/leagues`;
const GAMES_WEEK_URL = `${API_BASE_URL}/api/games/week`;

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
        setLeagues(data);
        if (data.length > 0) setSelectedLeague(data[0]._id);
      });
  }, []);

  // Cargar partidos de la semana de la liga seleccionada
  useEffect(() => {
    if (!selectedLeague) return;
    setLoading(true);
    fetch(`${GAMES_WEEK_URL}?league=${selectedLeague}`)
      .then((res) => res.json())
      .then((data) => {
        setGames(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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
            No hay partidos esta semana.
          </div>
        ) : (
          games.map((game, idx) => (
            <div className="game-card" key={idx}>
              <div className="teams">
                <div className="team">
                  <img
                    src={game.home_team_logo}
                    alt={game.home_team_abbr}
                    className="team-logo"
                  />
                  <span>
                    {/* Mostrar solo la abreviatura */}
                    {game.home_team_abbr}
                  </span>
                </div>
                <div className="team">
                  <img
                    src={game.away_team_logo}
                    alt={game.away_team_abbr}
                    className="team-logo"
                  />
                  <span>
                    {/* Mostrar solo la abreviatura */}
                    {game.away_team_abbr}
                  </span>
                </div>
              </div>
              <div className="game-date">
                {new Date(game.date).toLocaleDateString("es-CL", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                })}{" "}
                {new Date(game.date).toLocaleTimeString("es-CL", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HorizontalGamesCarousel;
