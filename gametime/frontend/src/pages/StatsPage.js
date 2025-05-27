import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../assets/Configuration/config';

const StatsPage = ({ language, activeLeague }) => {
  const [playerStats, setPlayerStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Si tienes activeLeague, filtra por liga
        const url = activeLeague
          ? `${API_BASE_URL}/api/player-stats?league=${activeLeague}`
          : `${API_BASE_URL}/api/player-stats`;
        const res = await fetch(url);
        const data = await res.json();
        setPlayerStats(Array.isArray(data) ? data : []);
      } catch {
        setPlayerStats([]);
      }
      setLoading(false);
    };
    fetchStats();
  }, [activeLeague]);

  return (
    <div className="container">
      <h2>Estadísticas individuales</h2>
      {loading ? (
        <div className="alert alert-info">
          Cargando estadísticas...
        </div>
      ) : playerStats.length === 0 ? (
        <div className="alert alert-info">
          No hay datos de estadísticas disponibles.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-bordered align-middle">
            <thead>
              <tr>
                <th>Jugador</th>
                <th>Equipo</th>
                <th>Aces por set</th>
                <th>Asistencias por set</th>
                <th>Ataques por set</th>
                <th>Bloqueos por set</th>
                <th>Defensas por set</th>
                <th>% Golpeo</th>
                <th>Remates por set</th>
                <th>Puntos por set</th>
              </tr>
            </thead>
            <tbody>
              {playerStats.map((p, idx) => (
                <tr key={idx}>
                  <td>{p.playerName}</td>
                  <td>{p.team}</td>
                  <td>{p.acesPerSet}</td>
                  <td>{p.assistsPerSet}</td>
                  <td>{p.attacksPerSet}</td>
                  <td>{p.blocksPerSet}</td>
                  <td>{p.digsPerSet}</td>
                  <td>{(p.hittingPercentage * 100).toFixed(1)}%</td>
                  <td>{p.killsPerSet}</td>
                  <td>{p.pointsPerSet}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StatsPage;
