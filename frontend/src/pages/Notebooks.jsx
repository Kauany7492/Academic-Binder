import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { FaEdit, FaTrash, FaPlus, FaSearch } from 'react-icons/fa';
import DriveButton from '../components/DriveButton';
import AccessLink from '../components/AccessLink';
import './Notebooks.css';

const Notebooks = () => {
  const [notebooks, setNotebooks] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ titulo: '', descricao: '', cor: '#806130' });
  const [exporting, setExporting] = useState(false);
  const [driveToken, setDriveToken] = useState(localStorage.getItem('driveToken'));

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

  const handleDriveExport = async (notebook) => {
    if (!driveToken) {
      window.location.href = `${process.env.REACT_APP_API_URL}/auth/google?state=notebook-${notebook.id}`;
      return;
    }
    setExporting(true);
    try {
      await api.post('/drive/export-notebook', { notebook_id: notebook.id }, {
        headers: { Authorization: `Bearer ${driveToken}` }
      });
      alert('Caderno exportado para o Drive com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar caderno:', error);
      alert('Falha ao enviar para o Drive.');
    } finally {
      setExporting(false);
    }
  };

  const filtered = notebooks.filter(n =>
    n.titulo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="notebooks-container">
      <div className="notebooks-header">
        <h1>Meus Cadernos</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <FaPlus /> Novo Caderno
        </button>
      </div>

      <div className="search-wrapper">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Buscar cadernos por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="notebooks-grid">
        {filtered.map(notebook => (
          <div
            key={notebook.id}
            className="notebook-card"
            style={{ borderTop: `4px solid ${notebook.cor}` }}
          >
            <h3>{notebook.titulo}</h3>
            <p>{notebook.descricao}</p>
            <div className="card-actions">
              <AccessLink to={`/notebooks/${notebook.id}`} />
              <button
                onClick={() => {
                  setEditing(notebook);
                  setForm(notebook);
                  setShowModal(true);
                }}
                className="icon-btn"
                title="Editar"
              >
                <FaEdit />
              </button>
              <DriveButton
                onClick={() => handleDriveExport(notebook)}
                disabled={exporting}
              />
              <button
                onClick={() => handleDelete(notebook.id)}
                className="icon-btn delete"
                title="Excluir"
              >
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
              <label>
                Título *
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  required
                />
              </label>
              <label>
                Descrição
                <textarea
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                />
              </label>
              <label>
                Cor
                <input
                  type="color"
                  value={form.cor}
                  onChange={(e) => setForm({ ...form, cor: e.target.value })}
                />
              </label>
              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  Salvar
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notebooks;