import React from 'react';
import LiveScoreModal from './LiveScoreModal';

function DuringMatch({
  liveScoreGame,
  setLiveScoreGame,
  leagueConfig,
  socket,
  games,
  setGames,
  setPublicGameModal,
  language
}) {
  // Solo muestra el marcador en vivo si hay partido en curso
  if (!liveScoreGame || liveScoreGame.partidoFinalizado) return null;
  return (
    <LiveScoreModal
      game={liveScoreGame}
      leagueConfig={leagueConfig}
      socket={socket}
      games={games}
      setGames={setGames}
      setLiveScoreGame={setLiveScoreGame}
      setPublicGameModal={setPublicGameModal}
      language={language}
    />
  );
}

export default DuringMatch;
