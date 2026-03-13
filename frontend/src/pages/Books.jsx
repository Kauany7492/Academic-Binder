import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';
import './Books.css';

const Books = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    total_pages: '',
    pages_read: '',
    status: 'quero ler'
  });
  const { isDark } = useTheme();

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/books');
      setBooks(res.data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar livros');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBook) {
        await api.put(`/books/${editingBook.id}`, formData);
      } else {
        await api.post('/books', formData);
      }
      fetchBooks();
      closeModal();
    } catch (err) {
      alert('Erro ao salvar livro');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este livro?')) {
      try {
        await api.delete(`/books/${id}`);
        fetchBooks();
      } catch (err) {
        alert('Erro ao excluir livro');
      }
    }
  };

  const openModal = (book = null) => {
    if (book) {
      setEditingBook(book);
      setFormData({
        title: book.title,
        author: book.author || '',
        total_pages: book.total_pages,
        pages_read: book.pages_read,
        status: book.status
      });
    } else {
      setEditingBook(null);
      setFormData({ title: '', author: '', total_pages: '', pages_read: 0, status: 'quero ler' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBook(null);
  };

  const getStatusLabel = (status) => {
    const labels = {
      'lendo': 'Lendo',
      'lido': 'Lido',
      'quero ler': 'Quero Ler'
    };
    return labels[status] || status;
  };

  if (loading) return <div className="loading">Carregando...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="books-container">
      <div className="books-header">
        <h1>Meus Livros</h1>
        <button onClick={() => openModal()} className="btn-primary">
          <FaPlus /> Novo Livro
        </button>
      </div>

      <div className="books-grid">
        {books.map(book => (
          <div key={book.id} className={`book-card ${isDark ? 'dark' : 'light'}`}>
            <div className="book-info">
              <h3>{book.title}</h3>
              <p className="author">{book.author || 'Autor desconhecido'}</p>
              <div className="progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${(book.pages_read / book.total_pages) * 100}%` }}
                  ></div>
                </div>
                <span>{book.pages_read} / {book.total_pages} páginas</span>
              </div>
              <span className={`status status-${book.status}`}>
                {getStatusLabel(book.status)}
              </span>
            </div>
            <div className="book-actions">
              <button onClick={() => openModal(book)}><FaEdit /></button>
              <button onClick={() => handleDelete(book.id)} className="delete"><FaTrash /></button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>{editingBook ? 'Editar Livro' : 'Novo Livro'}</h3>
            <form onSubmit={handleSubmit}>
              <label>
                Título *
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </label>
              <label>
                Autor
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                Total de Páginas *
                <input
                  type="number"
                  name="total_pages"
                  value={formData.total_pages}
                  onChange={handleInputChange}
                  min="1"
                  required
                />
              </label>
              <label>
                Páginas Lidas
                <input
                  type="number"
                  name="pages_read"
                  value={formData.pages_read}
                  onChange={handleInputChange}
                  min="0"
                  max={formData.total_pages}
                />
              </label>
              <label>
                Status
                <select name="status" value={formData.status} onChange={handleInputChange}>
                  <option value="quero ler">Quero Ler</option>
                  <option value="lendo">Lendo</option>
                  <option value="lido">Lido</option>
                </select>
              </label>
              <div className="modal-actions">
                <button type="submit">Salvar</button>
                <button type="button" onClick={closeModal}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Books;
