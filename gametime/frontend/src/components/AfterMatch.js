import React from 'react';

function AfterMatch({ publicGameModal, setPublicGameModal, language, texts }) {
  if (!publicGameModal) return null;
  // ...UI para mostrar resultado final, sets jugados, marcador final...
  return (
    <div className="modal-overlay" onClick={() => setPublicGameModal(null)}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <button
          className="btn btn-secondary close-button"
          onClick={() => setPublicGameModal(null)}
        >
          &times;
        </button>
        <div style={{ textAlign: 'center', marginBottom: 10 }}>
          <h3 style={{ marginBottom: 0 }}>
            {publicGameModal.team1} {texts[language]?.vs || 'vs'} {publicGameModal.team2}
          </h3>
          <div style={{ fontSize: 22, margin: '8px 0', fontWeight: 'bold' }}>
            {(publicGameModal.sets1 ?? 0)} - {(publicGameModal.sets2 ?? 0)}
          </div>
          <div style={{ fontSize: 15, color: '#888' }}>
            {publicGameModal.date} {publicGameModal.time}
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              <th style={{ padding: 6, border: '1px solid #ddd' }}></th>
              {Array.isArray(publicGameModal.setsHistory)
                ? publicGameModal.setsHistory.map((_, idx) => (
                    <th key={idx} style={{ padding: 6, border: '1px solid #ddd' }}>S{idx + 1}</th>
                  ))
                : null}
              <th style={{ padding: 6, border: '1px solid #ddd' }}>{language === 'en' ? 'Sets' : 'Sets'}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: 6, border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'right' }}>{publicGameModal.team1}</td>
              {Array.isArray(publicGameModal.setsHistory)
                ? publicGameModal.setsHistory.map((set, idx) => (
                    <td key={idx} style={{ padding: 6, border: '1px solid #ddd', textAlign: 'center' }}>
                      {set.score1}
                    </td>
                  ))
                : null}
              <td style={{ padding: 6, border: '1px solid #ddd', fontWeight: 'bold', background: '#eee', textAlign: 'center' }}>
                {publicGameModal.sets1 ?? '-'}
              </td>
            </tr>
            <tr>
              <td style={{ padding: 6, border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'right' }}>{publicGameModal.team2}</td>
              {Array.isArray(publicGameModal.setsHistory)
                ? publicGameModal.setsHistory.map((set, idx) => (
                    <td key={idx} style={{ padding: 6, border: '1px solid #ddd', textAlign: 'center' }}>
                      {set.score2}
                    </td>
                  ))
                : null}
              <td style={{ padding: 6, border: '1px solid #ddd', fontWeight: 'bold', background: '#eee', textAlign: 'center' }}>
                {publicGameModal.sets2 ?? '-'}
              </td>
            </tr>
          </tbody>
        </table>
        <div style={{ marginTop: 12, textAlign: 'center', color: '#007bff', fontWeight: 'bold', fontSize: 18 }}>
          {language === 'en' ? 'Finished' : 'Finalizado'}
        </div>
      </div>
    </div>
  );
}

export default AfterMatch;
