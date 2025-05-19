// filepath: c:\Users\artun\Desktop\Proyectos\Proyecto_Capstone\gametime\frontend\src\components\LiveScoreModal.js
import React, { useState, useEffect } from 'react';
import texts from '../translations/texts';
// Importa la URL base de la API desde el config
import { API_BASE_URL } from '../assets/Configuration/config';

const API_GAMES = `${API_BASE_URL}/api/games`;

function LiveScoreModal({
  game,
  leagueConfig,
  socket,
  games,
  setGames,
  setLiveScoreGame,
  setPublicGameModal,
  language
}) {
  const [liveSets, setLiveSets] = useState(game.setsHistory || []);
  const [currentSetScore, setCurrentSetScore] = useState({
    score1: typeof game.score1 === 'number' ? game.score1 : 0,
    score2: typeof game.score2 === 'number' ? game.score2 : 0
  });

  useEffect(() => {
    setLiveSets(game.setsHistory || []);
    const updatedGame = games.find(g => g._id === game._id);
    setCurrentSetScore({
      score1: typeof (updatedGame?.score1) === 'number' ? updatedGame.score1 : (typeof game.score1 === 'number' ? game.score1 : 0),
      score2: typeof (updatedGame?.score2) === 'number' ? updatedGame.score2 : (typeof game.score2 === 'number' ? game.score2 : 0)
    });
  }, [game, games]);

  useEffect(() => {
    if (game.partidoFinalizado) {
      setLiveScoreGame(null);
      setPublicGameModal(game);
    }
  }, [game, setLiveScoreGame, setPublicGameModal]);

  // Cierra el marcador si el partido termina y muestra el resultado final en el modal público
  useEffect(() => {
    // Calcula sets ganados por cada equipo
    let sets1 = 0, sets2 = 0;
    (game.setsHistory || []).forEach(s => {
      if (s.score1 > s.score2) sets1++;
      else if (s.score2 > s.score1) sets2++;
    });
    // Si el partido está finalizado (por backend) o por lógica local, cerrar el marcador y mostrar el resultado final
    if (
      game.partidoFinalizado ||
      sets1 === leagueConfig.setsToWin ||
      sets2 === leagueConfig.setsToWin
    ) {
      setLiveScoreGame(null);
      setPublicGameModal({
        ...game,
        partidoFinalizado: true,
        sets1,
        sets2
      });
    }
  }, [game, leagueConfig.setsToWin, setLiveScoreGame, setPublicGameModal]);

  const handleSetScoreChange = (team, delta) => {
    setCurrentSetScore(prev => {
      let s1 = prev.score1, s2 = prev.score2;
      if (team === 1) s1 = Math.max(0, s1 + delta);
      if (team === 2) s2 = Math.max(0, s2 + delta);
      const newScore = { score1: s1, score2: s2 };
      if (socket && game) {
        socket.emit('set_score_update', {
          gameId: game._id,
          setScore: newScore
        });
      }
      setGames(prevGames =>
        prevGames.map(g =>
          g._id === game._id
            ? { ...g, score1: newScore.score1, score2: newScore.score2 }
            : g
        )
      );
      fetch(`${API_GAMES}/${game._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score1: newScore.score1,
          score2: newScore.score2
        }),
      });
      return newScore;
    });
  };

  // Lógica de voley para finalizar set y partido
  function canFinishSet(score1, score2, setIndex, leagueConfig) {
    const totalSets = leagueConfig.setsToWin * 2 - 1;
    const isLastSet = setIndex === (totalSets - 1);
    const pointsToWin = isLastSet ? leagueConfig.lastSetPoints : 25;
    // Un equipo debe llegar a pointsToWin y tener diferencia de 2
    if (
      (score1 >= pointsToWin || score2 >= pointsToWin) &&
      Math.abs(score1 - score2) >= 2 &&
      score1 !== score2
    ) {
      return true;
    }
    return false;
  }

  // Lógica para determinar si el partido debe darse por terminado
  function isMatchFinished(setsHistory, leagueConfig) {
    let sets1 = 0, sets2 = 0;
    setsHistory.forEach(s => {
      if (s.score1 > s.score2) sets1++;
      else if (s.score2 > s.score1) sets2++;
    });
    // El partido termina cuando uno de los equipos alcanza la cantidad de sets para ganar según la liga
    return sets1 === (leagueConfig.setsToWin) || sets2 === (leagueConfig.setsToWin);
  }

  // Finalizar set manualmente y emitir historial por socket
  const handleFinishSet = async () => {
    const setIndex = liveSets.length;
    const { score1, score2 } = currentSetScore;
    if (!canFinishSet(score1, score2, setIndex, leagueConfig)) {
      alert(language === 'en'
        ? 'Set cannot be finished. Check points and difference.'
        : 'No se puede finalizar el set. Revisa los puntos y la diferencia.');
      return;
    }
    const newSets = [...liveSets, { score1, score2 }];
    let sets1 = 0, sets2 = 0;
    newSets.forEach(s => {
      if (s.score1 > s.score2) sets1++;
      else if (s.score2 > s.score1) sets2++;
    });
    // Determina si el partido debe finalizar según la lógica de la liga
    let partidoFinalizado = sets1 === leagueConfig.setsToWin || sets2 === leagueConfig.setsToWin;

    await fetch(`${API_GAMES}/${game._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        setsHistory: newSets,
        sets1,
        sets2,
        score1,
        score2,
        partidoFinalizado
      }),
    });
    if (socket) {
      socket.emit('sets_history_update', {
        gameId: game._id,
        setsHistory: newSets,
        sets1,
        sets2,
        score1,
        score2,
        partidoFinalizado
      });
    }
    setLiveSets(newSets);
    setCurrentSetScore({ score1: 0, score2: 0 });
    // También actualiza el backend para que el score1 y score2 del partido sean 0
    await fetch(`${API_GAMES}/${game._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        score1: 0,
        score2: 0
      }),
    });
    setGames(prevGames =>
      prevGames.map(g =>
        g._id === game._id
          ? { ...g, setsHistory: newSets, sets1, sets2, score1: 0, score2: 0, partidoFinalizado }
          : g
      )
    );
    // Si el partido terminó, cerrar el marcador y mostrar el resultado final
    if (partidoFinalizado) {
      setLiveScoreGame(null);
      setPublicGameModal({
        ...game,
        setsHistory: newSets,
        sets1,
        sets2,
        partidoFinalizado: true
      });
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setLiveScoreGame(null)}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button
          className="btn btn-secondary close-button"
          onClick={() => setLiveScoreGame(null)}
        >
          &times;
        </button>
        <div className="team-names-container modal-header">
          <span className="team-name">{game.team1}</span>
          <span className="vs-text">{texts[language]?.vs || 'vs'}</span>
          <span className="team-name" style={{ textAlign: 'right' }}>{game.team2}</span>
        </div>
        <div style={{ marginBottom: 16 }}>
          <strong>{language === 'en' ? 'Sets played:' : 'Sets jugados:'}</strong>
          <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
            {liveSets.map((set, idx) => (
              <span key={idx} className="score-box" style={{ fontSize: 18 }}>
                {set.score1} - {set.score2}
              </span>
            ))}
            {liveSets.length === 0 && (
              <span style={{ color: '#888' }}>
                {language === 'en' ? 'No sets finished yet.' : 'Aún no hay sets finalizados.'}
              </span>
            )}
          </div>
        </div>
        <div className="mb-2">
          <strong>{language === 'en' ? 'Current Set' : 'Set Actual'}:</strong>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginTop: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <button
                className="btn btn-success btn-sm"
                style={{ fontSize: 24, width: 40, marginBottom: 6 }}
                onClick={e => { e.stopPropagation(); handleSetScoreChange(1, +1); }}
                disabled={game.partidoFinalizado}
              >+</button>
              <span className="score-box" style={{ fontSize: 28 }}>{currentSetScore.score1}</span>
              <button
                className="btn btn-danger btn-sm"
                style={{ fontSize: 24, width: 40, marginTop: 6 }}
                onClick={e => { e.stopPropagation(); handleSetScoreChange(1, -1); }}
                disabled={currentSetScore.score1 <= 0 || game.partidoFinalizado}
              >-</button>
            </div>
            <span style={{ fontSize: 32, fontWeight: 'bold' }}>:</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <button
                className="btn btn-success btn-sm"
                style={{ fontSize: 24, width: 40, marginBottom: 6 }}
                onClick={e => { e.stopPropagation(); handleSetScoreChange(2, +1); }}
                disabled={game.partidoFinalizado}
              >+</button>
              <span className="score-box" style={{ fontSize: 28 }}>{currentSetScore.score2}</span>
              <button
                className="btn btn-danger btn-sm"
                style={{ fontSize: 24, width: 40, marginTop: 6 }}
                onClick={e => { e.stopPropagation(); handleSetScoreChange(2, -1); }}
                disabled={currentSetScore.score2 <= 0 || game.partidoFinalizado}
              >-</button>
            </div>
          </div>
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <button
              className="btn btn-primary"
              onClick={handleFinishSet}
              disabled={game.partidoFinalizado}
            >
              {language === 'en' ? 'Finish Set' : 'Finalizar Set'}
            </button>
            <div style={{ fontSize: 13, color: '#888', marginTop: 6 }}>
              {game.partidoFinalizado
                ? (language === 'en'
                  ? 'Match finished.'
                  : 'Partido finalizado.')
                : (language === 'en'
                  ? `A set ends at 25 points (or ${leagueConfig.lastSetPoints} in last set) with 2-point difference. Finish manually.`
                  : `Un set termina a 25 puntos (o ${leagueConfig.lastSetPoints} en el último) y diferencia de 2. Finaliza manualmente.`)
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveScoreModal;