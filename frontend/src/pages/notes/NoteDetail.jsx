import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import noteService from '../../services/noteService';
import './Notes.css';

const NoteDetail = () => {
  const { id } = useParams();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNote();
  }, [id]);

  const fetchNote = async () => {
    try {
      const res = await noteService.getNote(id);
      setNote(res.data);
    } catch (err) {
      console.error('Erro ao carregar anotação:', err);
      setError('Anotação não encontrada');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (!note || !note.content) return null;
    switch (note.type) {
      case 'cornell':
        return (
          <div>
            <h3>Cues</h3>
            <ul>{note.content.cues?.map((c, i) => <li key={i}>{c}</li>)}</ul>
            <h3>Notas</h3>
            <ul>{note.content.notes?.map((n, i) => <li key={i}>{n}</li>)}</ul>
            <h3>Resumo</h3>
            <p>{note.content.summary}</p>
          </div>
        );
      case 'outline':
        return (
          <div>
            {note.content.outline?.map((item, i) => (
              <div key={i} style={{ marginLeft: `${(item.level - 1) * 20}px` }}>
                {item.text}
              </div>
            ))}
          </div>
        );
      case 'mindmap':
        return (
          <div>
            <h3>Tópico Central: {note.content.centralTopic}</h3>
            {note.content.branches?.map((b, i) => (
              <div key={i}>
                <strong>{b.topic}</strong>
                <ul>{b.subtopics?.map((s, j) => <li key={j}>{s}</li>)}</ul>
              </div>
            ))}
          </div>
        );
      case 'charting':
        return (
          <div>
            <p>Tipo: {note.content.chartType}</p>
            <table border="1">
              <tbody>
                {note.content.rows?.map((row, i) => (
                  <tr key={i}>
                    {Object.entries(row).map(([key, val]) => (
                      <td key={key}>{key}: {val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'sentence':
        return (
          <ul>
            {note.content.sentences?.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        );
      case 'flow':
        return (
          <ol>
            {note.content.steps?.map((step, i) => <li key={i}>{step.description}</li>)}
          </ol>
        );
      case 'tnotes':
        return (
          <div>
            {note.content.topics?.map((t, i) => (
              <div key={i}>
                <h4>{t.topic}</h4>
                <ul>{t.notes?.map((n, j) => <li key={j}>{n}</li>)}</ul>
              </div>
            ))}
          </div>
        );
      case 'boxbullet':
        return (
          <div>
            {note.content.boxes?.map((b, i) => (
              <div key={i} style={{ border: '1px solid var(--border-light)', padding: 'var(--space-md)', margin: 'var(--space-md) 0' }}>
                <h3>{b.title}</h3>
                <ul>{b.bullets?.map((b, j) => <li key={j}>{b}</li>)}</ul>
              </div>
            ))}
          </div>
        );
      case 'rapidlogging':
        return (
          <ul>
            {note.content.entries?.map((e, i) => (
              <li key={i} style={{ textDecoration: e.completed ? 'line-through' : 'none' }}>
                {e.content} ({e.type})
              </li>
            ))}
          </ul>
        );
      case 'zettelkasten':
        return (
          <div>
            <p>ID: {note.content.noteId}</p>
            <p>Título: {note.content.title}</p>
            <p>Conteúdo: {note.content.content}</p>
            <p>Tags: {note.content.tags?.join(', ')}</p>
            <p>Links: {note.content.links?.join(', ')}</p>
          </div>
        );
      case 'framework':
        return (
          <div>
            <h3>{note.content.framework}</h3>
            {note.content.components?.map((c, i) => (
              <div key={i}>
                <strong>{c.name}</strong>: {c.description}
              </div>
            ))}
          </div>
        );
      default:
        return <pre>{JSON.stringify(note.content, null, 2)}</pre>;
    }
  };

  if (loading) return <div className="loading">Carregando...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!note) return null;

  return (
    <div className="note-detail-container">
      <div className="note-detail-header">
        <Link to="/notes" className="btn-secondary">← Voltar</Link>
        <Link to={`/notes/${id}/edit`} className="btn-primary">Editar</Link>
      </div>
      <h1>{note.title}</h1>
      <p className="note-type">Método: {note.type}</p>
      {note.file_ref && <p>Arquivo original: {note.file_ref}</p>}
      <div className="note-content">
        {renderContent()}
      </div>
      <div className="note-meta">
        <p>Criado em: {new Date(note.created_at).toLocaleString()}</p>
        <p>Última atualização: {new Date(note.updated_at).toLocaleString()}</p>
      </div>
    </div>
  );
};

export default NoteDetail;