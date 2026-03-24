import React from 'react';

const OutlineFields = ({ value, onChange }) => {
  const handleOutlineChange = (e) => {
    const lines = e.target.value.split('\n');
    const outline = lines.map(line => {
      const levelMatch = line.match(/^(\s*)/);
      const level = levelMatch ? Math.floor(levelMatch[0].length / 2) + 1 : 1;
      const text = line.trim();
      return { level, text };
    }).filter(item => item.text !== '');
    onChange({ ...value, outline });
  };

  return (
    <div>
      <label>
        Esboço (use espaços para indentação)
        <textarea
          value={value.outline?.map(item => '  '.repeat(item.level - 1) + item.text).join('\n') || ''}
          onChange={handleOutlineChange}
          rows={8}
        />
      </label>
    </div>
  );
};

export default OutlineFields;