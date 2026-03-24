import React from 'react';

const BoxAndBulletFields = ({ value, onChange }) => {
  const handleBoxesChange = (e) => {
    const boxes = e.target.value.split('\n').map(line => {
      const [title, bullets] = line.split(':');
      return {
        title: title?.trim(),
        bullets: bullets?.split(',').map(b => b.trim()).filter(Boolean) || []
      };
    }).filter(b => b.title);
    onChange({ ...value, boxes });
  };

  return (
    <div>
      <label>
        Caixas (formato: "Título: bala1, bala2")
        <textarea
          value={value.boxes?.map(b => `${b.title}: ${b.bullets.join(', ')}`).join('\n') || ''}
          onChange={handleBoxesChange}
          rows={6}
        />
      </label>
    </div>
  );
};

export default BoxAndBulletFields;