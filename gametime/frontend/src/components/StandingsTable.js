import React, { useEffect, useState } from 'react';
import Table from 'react-bootstrap/Table';
import '../styles/StandingsTable.css';

const StandingsTable = ({
  teams = [],
  games = [],
  leagueConfig = {},
  leagues = [],
  activeLeague = '',
  setActiveLeague = () => {}
}) => {
  const [standings, setStandings] = useState([]);

  // Mapea nombre de equipo a su abreviación y logo
  const teamAbbrMap = {};
  const teamLogoMap = {};
  teams.forEach(team => {
    teamAbbrMap[team.name] = team.abbr || team.name;
    teamLogoMap[team.name] = team.logo || '';
  });

  useEffect(() => {
    // Filtra equipos y partidos por la liga activa
    const filteredTeams = activeLeague
      ? teams.filter(team => team.league === activeLeague || team.league?._id === activeLeague)
      : teams;
    const filteredGames = activeLeague
      ? games.filter(game => game.league === activeLeague || game.league?._id === activeLeague)
      : games;

    const stats = {};
    filteredTeams.forEach((team) => {
      stats[team.name] = {
        team: team.name,
        played: 0,
        won: 0,
        lost: 0,
        setsWon: 0,
        setsLost: 0,
        points: 0,
      };
    });

    filteredGames
      .filter((g) => g.partidoFinalizado)
      .forEach((game) => {
        const t1 = stats[game.team1];
        const t2 = stats[game.team2];
        if (!t1 || !t2) return;
        t1.played += 1;
        t2.played += 1;
        const sets1 = game.sets1 ?? 0;
        const sets2 = game.sets2 ?? 0;
        t1.setsWon += sets1;
        t1.setsLost += sets2;
        t2.setsWon += sets2;
        t2.setsLost += sets1;
        if (sets1 > sets2) {
          t1.won += 1;
          t2.lost += 1;
          t1.points += leagueConfig.pointsWin ?? 3;
          t2.points += leagueConfig.pointsLose ?? 0;
        } else if (sets2 > sets1) {
          t2.won += 1;
          t1.lost += 1;
          t2.points += leagueConfig.pointsWin ?? 3;
          t1.points += leagueConfig.pointsLose ?? 0;
        }
      });

    const arr = Object.values(stats).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const diffA = a.setsWon - a.setsLost;
      const diffB = b.setsWon - b.setsLost;
      return diffB - diffA;
    });
    setStandings(arr);
  }, [teams, games, leagueConfig, activeLeague]);

  // Colores para los primeros puestos
  const getRowClass = (idx) => {
    if (idx === 0) return 'standings-row first-place';
    if (idx === 1) return 'standings-row second-place';
    if (idx === 2) return 'standings-row third-place';
    return 'standings-row';
  };

  return (
    <div className="standingsWrapper" style={{ overflowX: 'visible', width: '100%', paddingBottom: 0 }}>
      {/* Selector de liga arriba de la tabla */}
      {leagues.length > 0 && (
        <div className="standings-league-select-wrapper">
          <label style={{ fontWeight: 'bold', marginRight: 8 }}>
            {/* Puedes poner aquí un texto si lo deseas, por ejemplo: 'Liga:' */}
          </label>
          <select
            className="standings-league-select"
            value={activeLeague}
            onChange={e => setActiveLeague(e.target.value)}
          >
            <option value="" disabled>
              Selecciona una liga
            </option>
            {leagues.map(l => (
              <option key={l._id} value={l._id}>{l.name}</option>
            ))}
          </select>
        </div>
      )}
      <div className="standings-table-container">
        <Table
          striped
          bordered
          hover
          size="sm"
          className="standingsTable"
          style={{
            minWidth: 0,
            width: '100%',
            maxWidth: '100%',
            tableLayout: 'fixed',
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 4px 18px 0 rgba(0,0,0,0.10)'
          }}
        >
          <thead>
            <tr className="standings-header-row">
              <th style={{ width: 50, background: '#1e293b', color: '#fff', border: 'none' }}></th>
              <th style={{ minWidth: 80, background: '#1e293b', color: '#fff', border: 'none', textAlign: 'left' }}></th>
              <th style={{ width: '13%', textAlign: 'center', background: '#1e293b', color: '#fff', border: 'none' }}>J</th>
              <th style={{ width: '13%', textAlign: 'center', background: '#1e293b', color: '#fff', border: 'none' }}>G</th>
              <th style={{ width: '13%', textAlign: 'center', background: '#1e293b', color: '#fff', border: 'none' }}>P</th>
              <th style={{ width: '13%', textAlign: 'center', background: '#1e293b', color: '#fff', border: 'none' }}>+/-</th>
              <th style={{ width: '13%', textAlign: 'center', background: '#1e293b', color: '#fff', border: 'none' }}>Pts</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team, idx) => (
              <tr key={team.team} className={getRowClass(idx)}>
                <td>
                  {teamLogoMap[team.team] && (
                    <img
                      src={teamLogoMap[team.team]}
                      alt={teamAbbrMap[team.team] || team.team}
                      style={{
                        height: 45,
                        width: 45,
                        objectFit: 'contain',
                        background: 'transparent',
                        borderRadius: 8,
                        border: '2px solid #e2e8f0'
                      }}
                    />
                  )}
                </td>
                <td
                  style={{
                    textAlign: 'left',
                    fontWeight: 'bold',
                    fontSize: '1.1em',
                    verticalAlign: 'middle',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: 'var(--abbr-max-width, 180px)',
                    minWidth: 0,
                  }}
                >
                  <span className="standings-abbr-text">
                    {teamAbbrMap[team.team] || team.team}
                  </span>
                </td>
                <td style={{ textAlign: 'center', fontWeight: 500, fontSize: 16 }}>{team.played}</td>
                <td style={{ textAlign: 'center', fontWeight: 500, fontSize: 16 }}>{team.won}</td>
                <td style={{ textAlign: 'center', fontWeight: 500, fontSize: 16 }}>{team.lost}</td>
                <td style={{ textAlign: 'center', fontWeight: 500, fontSize: 16 }}>{team.setsWon - team.setsLost}</td>
                <td style={{ textAlign: 'center', fontWeight: 700, fontSize: 18, color: '#1e293b' }}>{team.points}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default StandingsTable;
