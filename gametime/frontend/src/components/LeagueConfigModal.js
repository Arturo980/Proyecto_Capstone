import React, { useEffect } from 'react';

function LeagueConfigModal({ league, onSave, onDelete, onClose, loading, language, editConfig, handleEditConfigChange }) {
  const [editSetsToWin, setEditSetsToWin] = React.useState(league?.setsToWin ?? 3);
  const [editLastSetPoints, setEditLastSetPoints] = React.useState(league?.lastSetPoints ?? 15);

  React.useEffect(() => {
    setEditSetsToWin(league?.setsToWin ?? 3);
    setEditLastSetPoints(league?.lastSetPoints ?? 15);
  }, [league]);

  // Sincroniza el nombre si editConfig.name está vacío
  useEffect(() => {
    if (league && !editConfig.name) {
      handleEditConfigChange({ target: { name: 'name', value: league.name } });
    }
    // eslint-disable-next-line
  }, [league]);

  const handleEditConfigChangeInternal = (e) => {
    const { name, value } = e.target;
    handleEditConfigChange({
      target: {
        name,
        value: name === 'setsToWin' || name === 'lastSetPoints' ? Number(value) : value,
      },
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ textAlign: 'left', maxWidth: 400 }}>
        <button
          className="btn btn-secondary close-button"
          onClick={onClose}
        >
          &times;
        </button>
        <h4 style={{ textAlign: 'center', marginBottom: 24 }}>
          {language === 'en' ? 'League Design' : 'Configuración de Liga'}
        </h4>
        <form onSubmit={onSave}>
          <div className="mb-2">
            <label className="form-label">
              {language === 'en' ? 'League Name:' : 'Nombre de la Liga:'}
            </label>
            <input
              type="text"
              className="form-control"
              name="name"
              value={editConfig.name ?? league?.name ?? ''}
              onChange={handleEditConfigChange}
              required
            />
          </div>
          <div className="mb-2">
            <label className="form-label">
              {language === 'en' ? 'Sets to Win:' : 'Sets para ganar:'}
            </label>
            <select
              className="form-select"
              name="setsToWin"
              value={editConfig.setsToWin}
              onChange={handleEditConfigChangeInternal}
            >
              <option value={2}>3</option>
              <option value={3}>5</option>
            </select>
          </div>
          <div className="mb-2">
            <label className="form-label">
              {language === 'en' ? 'Last Set Points:' : 'Puntos último set:'}
            </label>
            <select
              className="form-select"
              name="lastSetPoints"
              value={editConfig.lastSetPoints}
              onChange={handleEditConfigChangeInternal}
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
            </select>
          </div>
          <div className="mb-2">
            <label className="form-label">
              {language === 'en' ? 'Points for Win:' : 'Puntos por victoria:'}
            </label>
            <input
              type="number"
              className="form-control"
              name="pointsWin"
              value={editConfig.pointsWin}
              onChange={handleEditConfigChange}
              min={0}
              required
            />
          </div>
          <div className="mb-2">
            <label className="form-label">
              {language === 'en' ? 'Points for Loss:' : 'Puntos por derrota:'}
            </label>
            <input
              type="number"
              className="form-control"
              name="pointsLose"
              value={editConfig.pointsLose}
              onChange={handleEditConfigChange}
              min={0}
              required
            />
          </div>
          <div className="d-flex gap-2 mt-3 flex-column">
            <button className="btn btn-success w-100" type="submit" disabled={loading}>
              {language === 'en' ? 'Save' : 'Guardar'}
            </button>
            <button className="btn btn-danger w-100" type="button" onClick={() => onDelete(league?._id)} disabled={loading}>
              {language === 'en' ? 'Delete League' : 'Eliminar Liga'}
            </button>
            <button className="btn btn-secondary w-100" type="button" onClick={onClose} disabled={loading}>
              {language === 'en' ? 'Cancel' : 'Cancelar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LeagueConfigModal;
