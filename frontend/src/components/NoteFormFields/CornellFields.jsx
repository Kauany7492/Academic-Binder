import React from 'react';

const CornellFields = ({ value, onChange }) => {
  const handleCuesChange = (e) => {
    const cues = e.target.value.split('\n').filter(line => line.trim() !== '');
    onChange({ ...value, cues });
  };
  const handleNotesChange = (e) => {
    const notes = e.target.value.split('\n').filter(line => line.trim() !== '');
    onChange({ ...value, notes });
  };
  const handleSummaryChange = (e) => {
    onChange({ ...value, summary: e.target.value });
  };

  return (
    <div className="cornell-fields">
      <label>
        Cues (uma por linha)
        <textarea
          value={value.cues?.join('\n') || ''}
          onChange={handleCuesChange}
          rows={4}
        />
      </label>
      <label>
        Notas (uma por linha)
        <textarea
          value={value.notes?.join('\n') || ''}
          onChange={handleNotesChange}
          rows={6}
        />
      </label>
      <label>
        Resumo
        <textarea
          value={value.summary || ''}
          onChange={handleSummaryChange}
          rows={3}
        />
      </label>
    </div>
  );
};

export default CornellFields;