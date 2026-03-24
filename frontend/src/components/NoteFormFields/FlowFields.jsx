import React from 'react';

const FlowFields = ({ value, onChange }) => {
  const handleStepsChange = (e) => {
    const steps = e.target.value.split('\n').map((line, idx) => ({
      order: idx + 1,
      description: line.trim()
    })).filter(s => s.description);
    onChange({ ...value, steps });
  };

  return (
    <div>
      <label>
        Passos (um por linha)
        <textarea
          value={value.steps?.map(s => s.description).join('\n') || ''}
          onChange={handleStepsChange}
          rows={8}
        />
      </label>
    </div>
  );
};

export default FlowFields;