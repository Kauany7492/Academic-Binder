import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NoteForm from '../../components/NoteForm';
import noteService from '../../services/noteService';

const NoteEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNote();
  }, [id]);

  const fetchNote = async () => {
    try {
      const res = await noteService.getNote(id);
      setInitialData(res.data);
    } catch (err) {
      setError('Anotação não encontrada');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async ({ title, type, content, file }) => {
    try {
      if (file) {
        alert('Para alterar o arquivo, crie uma nova anotação.');
        return;
      } else {
        await noteService.updateNote(id, { title, type, content });
        navigate(`/notes/${id}`);
      }
    } catch (err) {
      console.error('Erro ao atualizar anotação:', err);
      alert('Erro ao atualizar anotação.');
    }
  };

  if (loading) return <div>Carregando...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!initialData) return null;

  return (
    <div className="note-form-container">
      <h1>Editar Anotação</h1>
      <NoteForm initialData={initialData} onSubmit={handleSubmit} submitLabel="Atualizar" />
    </div>
  );
};

export default NoteEdit;