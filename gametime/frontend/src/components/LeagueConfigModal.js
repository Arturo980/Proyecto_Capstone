import React from 'react';

function LeagueConfigModal({ league, onSave, onDelete, onClose, loading, language }) {
  const [editSetsToWin, setEditSetsToWin] = React.useState(league?.setsToWin ?? 3);
  const [editLastSetPoints, setEditLastSetPoints] = React.useState(league?.lastSetPoints ?? 15);

  React.useEffect(() => {
    setEditSetsToWin(league?.setsToWin ?? 3);
    setEditLastSetPoints(league?.lastSetPoints ?? 15);
  }, [league]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button
          className="btn btn-secondary close-button"
          onClick={onClose}
        >
          &times;
        </button>
        <h4>{language === 'en' ? 'League Design' : 'Diseño de Liga'}</h4>
        <div className="d-flex flex-column gap-2 mt-3">
          <div>
            <label className="form-label mb-0 me-1">
              {language === 'en' ? 'Sets:' : 'Sets:'}
            </label>
            <select
              className="form-select d-inline-block"
              value={editSetsToWin}
              onChange={e => setEditSetsToWin(Number(e.target.value))}
              style={{ width: 120, display: 'inline-block', marginLeft: 8 }}
            >
              <option value={2}>3</option>
              <option value={3}>5</option>
            </select>
          </div>
          <div>
            <label className="form-label mb-0 me-1">
              {language === 'en' ? 'Last set points:' : 'Puntos último set:'}
            </label>
            <select
              className="form-select d-inline-block"
              value={editLastSetPoints}
              onChange={e => setEditLastSetPoints(Number(e.target.value))}
              style={{ width: 80, display: 'inline-block', marginLeft: 8 }}
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
            </select>
          </div>
          <div className="d-flex gap-2 mt-2">
            <button
              className="btn btn-success"
              onClick={() => onSave(editSetsToWin, editLastSetPoints)}
              disabled={loading}
            >
              {language === 'en' ? 'Save' : 'Guardar'}
            </button>
            <button
              className="btn btn-danger"
              onClick={onDelete}
              disabled={loading}
            >
              {language === 'en' ? 'Delete League' : 'Eliminar Liga'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeagueConfigModal;
