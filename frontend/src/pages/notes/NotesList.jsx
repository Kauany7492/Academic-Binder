import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import noteService from '../../services/noteService';
import NoteCard from '../../components/NoteCard';
import './Notes.css';

const NotesList = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotes();
  }, [filterType]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const params = filterType ? { type: filterType } : {};
      const res = await noteService.getNotes(params);
      setNotes(res.data);
      setError('');
    } catch (err) {
      console.error('Erro ao carregar notas:', err);
      setError('Não foi possível carregar as anotações.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  return (
    <div className="notes-container">
      <div className="notes-header">
        <h1>Minhas Anotações</h1>
        <Link to="/notes/create" className="btn-primary">Nova Anotação</Link>
      </div>
      <div className="notes-filters">
        <label>
          Filtrar por método:
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">Todos</option>
            <option value="cornell">Cornell</option>
            <option value="outline">Esboço</option>
            <option value="mindmap">Mapa Mental</option>
            <option value="charting">Gráficos</option>
            <option value="sentence">Frase</option>
            <option value="flow">Fluxo</option>
            <option value="tnotes">T-notes</option>
            <option value="boxbullet">Box and Bullet</option>
            <option value="rapidlogging">Rapid Logging</option>
            <option value="zettelkasten">Zettelkasten</option>
            <option value="framework">Arcabouço</option>
          </select>
        </label>
      </div>
      {loading && <p>Carregando...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && notes.length === 0 && (
        <p>Nenhuma anotação encontrada.</p>
      )}
      <div className="notes-grid">
        {notes.map(note => (
          <NoteCard key={note.id} note={note} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
};

export default NotesList;