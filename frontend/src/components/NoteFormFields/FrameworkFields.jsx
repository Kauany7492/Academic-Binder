import React from 'react';

const FrameworkFields = ({ value, onChange }) => {
  const handleFrameworkChange = (e) => {
    onChange({ ...value, framework: e.target.value });
  };
  const handleComponentsChange = (e) => {
    const components = e.target.value.split('\n').map(line => {
      const [name, description] = line.split(':');
      return {
        name: name?.trim(),
        description: description?.trim()
      };
    }).filter(c => c.name);
    onChange({ ...value, components });
  };

  return (
    <div>
      <label>
        Nome do Arcabouço
        <input type="text" value={value.framework || ''} onChange={handleFrameworkChange} />
      </label>
      <label>
        Componentes (formato: "Nome: descrição")
        <textarea
          value={value.components?.map(c => `${c.name}: ${c.description}`).join('\n') || ''}
          onChange={handleComponentsChange}
          rows={6}
        />
      </label>
    </div>
  );
};

export default FrameworkFields;