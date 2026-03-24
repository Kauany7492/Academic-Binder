import React from 'react';
import { useNavigate } from 'react-router-dom';
import NoteForm from '../../components/NoteForm';
import noteService from '../../services/noteService';

const NoteCreate = () => {
  const navigate = useNavigate();

  const handleSubmit = async ({ title, type, content, file }) => {
    try {
      if (file) {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('type', type);
        formData.append('file', file);
        const res = await noteService.createFromFile(formData);
        navigate(`/notes/${res.data.id}`);
      } else {
        const res = await noteService.createCustom({ title, type, content });
        navigate(`/notes/${res.data.id}`);
      }
    } catch (err) {
      console.error('Erro ao criar anotação:', err);
      alert('Erro ao criar anotação. Verifique os dados e tente novamente.');
    }
  };

  return (
    <div className="note-form-container">
      <h1>Nova Anotação</h1>
      <NoteForm onSubmit={handleSubmit} submitLabel="Criar" />
    </div>
  );
};

export default NoteCreate;