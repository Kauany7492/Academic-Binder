import React, { useState } from 'react';
import CornellFields from './NoteFormFields/CornellFields';
import OutlineFields from './NoteFormFields/OutlineFields';
import MindMappingFields from './NoteFormFields/MindMappingFields';
import ChartingFields from './NoteFormFields/ChartingFields';
import SentenceFields from './NoteFormFields/SentenceFields';
import FlowFields from './NoteFormFields/FlowFields';
import TNotesFields from './NoteFormFields/TNotesFields';
import BoxAndBulletFields from './NoteFormFields/BoxAndBulletFields';
import RapidLoggingFields from './NoteFormFields/RapidLoggingFields';
import ZettelkastenFields from './NoteFormFields/ZettelkastenFields';
import FrameworkFields from './NoteFormFields/FrameworkFields';

const fieldComponents = {
  cornell: CornellFields,
  outline: OutlineFields,
  mindmap: MindMappingFields,
  charting: ChartingFields,
  sentence: SentenceFields,
  flow: FlowFields,
  tnotes: TNotesFields,
  boxbullet: BoxAndBulletFields,
  rapidlogging: RapidLoggingFields,
  zettelkasten: ZettelkastenFields,
  framework: FrameworkFields
};

const NoteForm = ({ initialData, onSubmit, submitLabel = 'Salvar' }) => {
  const [type, setType] = useState(initialData?.type || 'cornell');
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || {});
  const [file, setFile] = useState(null);

  const handleTypeChange = (e) => {
    setType(e.target.value);
    setContent({}); // reset content when type changes
  };

  const handleContentChange = (newContent) => {
    setContent(newContent);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ title, type, content, file });
  };

  const SpecificFields = fieldComponents[type] || (() => <div>Formulário para {type} não implementado</div>);

  return (
    <form onSubmit={handleSubmit} className="note-form">
      <label>
        Título *
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </label>
      <label>
        Método
        <select value={type} onChange={handleTypeChange}>
          <option value="cornell">Cornell</option>
          <option value="outline">Esboço (Outline)</option>
          <option value="mindmap">Mapa Mental (Mind Mapping)</option>
          <option value="charting">Gráficos (Charting)</option>
          <option value="sentence">Frase (Sentence)</option>
          <option value="flow">Fluxo (Flow)</option>
          <option value="tnotes">T-notes</option>
          <option value="boxbullet">Box and Bullet</option>
          <option value="rapidlogging">Rapid Logging</option>
          <option value="zettelkasten">Zettelkasten</option>
          <option value="framework">Arcabouço (Framework)</option>
        </select>
      </label>

      {!initialData?.file_ref && (
        <label>
          Arquivo (opcional, para extrair conteúdo)
          <input
            type="file"
            accept=".pdf,.txt,.md,.docx"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </label>
      )}

      <SpecificFields value={content} onChange={handleContentChange} />

      <button type="submit" className="btn-primary">{submitLabel}</button>
    </form>
  );
};

export default NoteForm;