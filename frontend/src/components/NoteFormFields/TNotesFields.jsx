import React from 'react';

const TNotesFields = ({ value, onChange }) => {
  const handleTopicsChange = (e) => {
    const topics = e.target.value.split('\n').map(line => {
      const [topic, notes] = line.split(':');
      return {
        topic: topic?.trim(),
        notes: notes?.split(',').map(n => n.trim()).filter(Boolean) || []
      };
    }).filter(t => t.topic);
    onChange({ ...value, topics });
  };

  return (
    <div>
      <label>
        Tópicos (formato: "Tópico: nota1, nota2")
        <textarea
          value={value.topics?.map(t => `${t.topic}: ${t.notes.join(', ')}`).join('\n') || ''}
          onChange={handleTopicsChange}
          rows={6}
        />
      </label>
    </div>
  );
};

export default TNotesFields;