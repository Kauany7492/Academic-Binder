import React from 'react';

const ZettelkastenFields = ({ value, onChange }) => {
  const handleNoteIdChange = (e) => {
    onChange({ ...value, noteId: e.target.value });
  };
  const handleTitleChange = (e) => {
    onChange({ ...value, title: e.target.value });
  };
  const handleContentChange = (e) => {
    onChange({ ...value, content: e.target.value });
  };
  const handleTagsChange = (e) => {
    const tags = e.target.value.split(',').map(t => t.trim());
    onChange({ ...value, tags });
  };
  const handleLinksChange = (e) => {
    const links = e.target.value.split(',').map(l => l.trim());
    onChange({ ...value, links });
  };

  return (
    <div>
      <label>
        ID da Nota
        <input type="text" value={value.noteId || ''} onChange={handleNoteIdChange} />
      </label>
      <label>
        Título
        <input type="text" value={value.title || ''} onChange={handleTitleChange} />
      </label>
      <label>
        Conteúdo
        <textarea value={value.content || ''} onChange={handleContentChange} rows={6} />
      </label>
      <label>
        Tags (separadas por vírgula)
        <input type="text" value={value.tags?.join(', ') || ''} onChange={handleTagsChange} />
      </label>
      <label>
        Links (separados por vírgula)
        <input type="text" value={value.links?.join(', ') || ''} onChange={handleLinksChange} />
      </label>
    </div>
  );
};

export default ZettelkastenFields;