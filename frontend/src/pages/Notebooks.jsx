import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

const Notebooks = () => {
  const [notebooks, setNotebooks] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ titulo: '', descricao: '', cor: '#806130' });

  useEffect(() => {
    fetchNotebooks();
  }, []);

  const fetchNotebooks = async () => {
    try {
      const res = await api.get('/cadernos');
      setNotebooks(res.data);
    } catch (error) {
      console.error('Erro ao carregar cadernos:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/cadernos/${editing.id}`, form);
      } else {
        await api.post('/cadernos', form);
      }
      fetchNotebooks();
      setShowModal(false);
      setEditing(null);
      setForm({ titulo: '', descricao: '', cor: '#806130' });
    } catch (error) {
      console.error('Erro ao salvar caderno:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir?')) {
      try {
        await api.delete(`/cadernos/${id}`);
        fetchNotebooks();
      } catch (error) {
        console.error('Erro ao deletar caderno:', error);
      }
    }
  };

  const filtered = notebooks.filter(n =>
    n.titulo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <h1>Notebooks</h1>
      <div className="notebooks-toolbar">
        <input
          type="text"
          placeholder="Buscar cadernos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <FaPlus /> Novo Caderno
        </button>
      </div>

      <div className="notebooks-grid">
        {filtered.map(notebook => (
          <div key={notebook.id} className="notebook-card" style={{ borderTop: `4px solid ${notebook.cor}` }}>
            <h3>{notebook.titulo}</h3>
            <p>{notebook.descricao}</p>
            <div className="card-actions">
              <Link to={`/notebooks/${notebook.id}`} className="btn-view">Acessar</Link>
              <button onClick={() => { setEditing(notebook); setForm(notebook); setShowModal(true); }}>
                <FaEdit />
              </button>
              <button onClick={() => handleDelete(notebook.id)}>
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>{editing ? 'Editar' : 'Novo'} Caderno</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Título"
                value={form.titulo}
                onChange={(e) => setForm({...form, titulo: e.target.value})}
                required
              />
              <textarea
                placeholder="Descrição"
                value={form.descricao}
                onChange={(e) => setForm({...form, descricao: e.target.value})}
              />
              <input
                type="color"
                value={form.cor}
                onChange={(e) => setForm({...form, cor: e.target.value})}
              />
              <div className="modal-actions">
                <button type="submit">Salvar</button>
                <button type="button" onClick={() => setShowModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notebooks;
