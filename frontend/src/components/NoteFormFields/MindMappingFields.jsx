import React from 'react';

const MindMappingFields = ({ value, onChange }) => {
  const handleCentralTopicChange = (e) => {
    onChange({ ...value, centralTopic: e.target.value });
  };
  const handleBranchesChange = (e) => {
    const branches = e.target.value.split('\n').map(line => {
      const [topic, subtopics] = line.split(':');
      return {
        topic: topic?.trim(),
        subtopics: subtopics?.split(',').map(s => s.trim()).filter(Boolean) || []
      };
    }).filter(b => b.topic);
    onChange({ ...value, branches });
  };

  return (
    <div>
      <label>
        Tópico Central
        <input
          type="text"
          value={value.centralTopic || ''}
          onChange={handleCentralTopicChange}
        />
      </label>
      <label>
        Ramos (formato: "Tópico: subtópico1, subtópico2")
        <textarea
          value={value.branches?.map(b => `${b.topic}: ${b.subtopics.join(', ')}`).join('\n') || ''}
          onChange={handleBranchesChange}
          rows={6}
        />
      </label>
    </div>
  );
};

export default MindMappingFields;