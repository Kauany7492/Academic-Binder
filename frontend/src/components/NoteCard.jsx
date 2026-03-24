import React from 'react';
import { Link } from 'react-router-dom';
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import noteService from '../services/noteService';
import './NoteCard.css';

const NoteCard = ({ note, onDelete }) => {
  const { user } = useAuth();

  const handleDelete = async () => {
    if (window.confirm('Excluir esta anotação?')) {
      try {
        await noteService.deleteNote(note.id);
        if (onDelete) onDelete(note.id);
      } catch (err) {
        console.error('Erro ao excluir anotação:', err);
        alert('Erro ao excluir anotação.');
      }
    }
  };

  return (
    <div className="note-card">
      <h3>{note.title}</h3>
      <p className="note-type">Método: {note.type}</p>
      <div className="note-meta">
        <span>Criado em: {new Date(note.created_at).toLocaleDateString()}</span>
        {note.file_ref && <span>Arquivo: {note.file_ref}</span>}
      </div>
      <div className="note-actions">
        <Link to={`/notes/${note.id}`} title="Ver detalhes">
          <FaEye />
        </Link>
        <Link to={`/notes/${note.id}/edit`} title="Editar">
          <FaEdit />
        </Link>
        <button onClick={handleDelete} title="Excluir">
          <FaTrash />
        </button>
      </div>
    </div>
  );
};

export default NoteCard;