import React from 'react';

const SentenceFields = ({ value, onChange }) => {
  const handleSentencesChange = (e) => {
    const sentences = e.target.value.split('\n').filter(line => line.trim() !== '');
    onChange({ ...value, sentences });
  };

  return (
    <div>
      <label>
        Frases (uma por linha)
        <textarea
          value={value.sentences?.join('\n') || ''}
          onChange={handleSentencesChange}
          rows={8}
        />
      </label>
    </div>
  );
};

export default SentenceFields;