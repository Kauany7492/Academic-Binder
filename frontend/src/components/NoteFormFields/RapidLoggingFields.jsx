import React from 'react';

const RapidLoggingFields = ({ value, onChange }) => {
  const handleEntriesChange = (e) => {
    const entries = e.target.value.split('\n').map(line => {
      const [type, content] = line.split(' ');
      return {
        type: type === '•' ? 'task' : type === '○' ? 'event' : 'note',
        content: content || line,
        completed: type === '✓' ? true : false
      };
    });
    onChange({ ...value, entries });
  };

  return (
    <div>
      <label>
        Entradas (use • para tarefa, ○ para evento, ✓ para concluído)
        <textarea
          value={value.entries?.map(e => `${e.completed ? '✓' : (e.type === 'task' ? '•' : '○')} ${e.content}`).join('\n') || ''}
          onChange={handleEntriesChange}
          rows={8}
        />
      </label>
    </div>
  );
};

export default RapidLoggingFields;