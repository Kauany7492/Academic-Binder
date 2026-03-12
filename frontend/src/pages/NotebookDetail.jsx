import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { FaMicrophone, FaUpload, FaLink, FaTrash } from 'react-icons/fa';
import AudioRecorder from '../components/AudioRecorder';
import DownloadButton from '../components/DownloadButton';

const NotebookDetail = () => {
  const { id } = useParams();
  const [notebook, setNotebook] = useState(null);
  const [paginas, setPaginas] = useState([]);
  const [destaques, setDestaques] = useState([]);
  const [showRecorder, setShowRecorder] = useState(false);
  const [selectedMetodo, setSelectedMetodo] = useState('cornell');
  const [showHighlightModal, setShowHighlightModal] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [highlightColor, setHighlightColor] = useState('#ffff00');
  const [highlightComment, setHighlightComment] = useState('');
  const [currentPagina, setCurrentPagina] = useState(null);
  const [linkUniversidade, setLinkUniversidade] = useState('');
  const [editingLink, setEditingLink] = useState(false);
  const [uploadingNotes, setUploadingNotes] = useState(false);
  const [pdfs, setPdfs] = useState([]);
  const [podcasts, setPodcasts] = useState([]);

  useEffect(() => {
    fetchNotebook();
    fetchPaginas();
    fetchPDFs();
    fetchPodcasts();
  }, [id]);

  const fetchNotebook = async () => {
    try {
      const res = await api.get(`/cadernos/${id}`);
      setNotebook(res.data);
      setLinkUniversidade(res.data.link_universidade || '');
    } catch (error) {
      console.error(error);
    }
  };

  const fetchPaginas = async () => {
    try {
      const res = await api.get(`/cadernos/${id}/paginas`);
      setPaginas(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchPDFs = async () => {
    try {
      const res = await api.get(`/pdfs?caderno_id=${id}`);
      setPdfs(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchPodcasts = async () => {
    try {
      const res = await api.get(`/podcasts?caderno_id=${id}`);
      setPodcasts(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchDestaques = async (paginaId) => {
    try {
      const res = await api.get(`/paginas/${paginaId}/destaques`);
      setDestaques(prev => [...prev.filter(d => d.pagina_id !== paginaId), ...res.data]);
    } catch (error) {
      console.error(error);
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection.toString().trim()) {
      setSelectedText(selection.toString());
      setShowHighlightModal(true);
    }
  };

  const handleSaveHighlight = async () => {
    if (!selectedText || !currentPagina) return;
    try {
      const res = await api.post('/destaques', {
        pagina_id: currentPagina.id,
        trecho: selectedText,
        cor: highlightColor,
        comentario: highlightComment,
      });
      setDestaques([...destaques, res.data]);
      setShowHighlightModal(false);
      setSelectedText('');
      setHighlightComment('');
    } catch (error) {
      console.error(error);
    }
  };

  const handleFileUploadForNotes = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('caderno_id', id);
    formData.append('metodo', selectedMetodo);
    formData.append('titulo', `Notas de ${file.name}`);
    try {
      setUploadingNotes(true);
      const res = await api.post('/gerar-anotacoes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchPaginas();
    } catch (error) {
      console.error('Erro ao gerar anotações:', error);
      alert('Erro ao processar arquivo. Verifique o formato.');
    } finally {
      setUploadingNotes(false);
    }
  };

  const handleUpdateLink = async () => {
    try {
      await api.put(`/cadernos/${id}`, { link_universidade });
      setEditingLink(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeletePagina = async (paginaId) => {
    if (window.confirm('Excluir esta página?')) {
      try {
        await api.delete(`/paginas/${paginaId}`);
        fetchPaginas();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleAudioProcessed = (novaPagina) => {
    setPaginas([novaPagina, ...paginas]);
    setShowRecorder(false);
  };

  return (
    <div className="page-container">
      {notebook && (
        <>
          <div className="notebook-header">
            <h1>{notebook.titulo}</h1>
            <div className="university-link">
              {editingLink ? (
                <div>
                  <input
                    type="url"
                    value={linkUniversidade}
                    onChange={(e) => setLinkUniversidade(e.target.value)}
                    placeholder="https://universidade.edu.br/materia"
                  />
                  <button onClick={handleUpdateLink}>Salvar</button>
                  <button onClick={() => setEditingLink(false)}>Cancelar</button>
                </div>
              ) : (
                <div>
                  {notebook.link_universidade ? (
                    <a href={notebook.link_universidade} target="_blank" rel="noopener noreferrer">
                      <FaLink /> Site da Universidade
                    </a>
                  ) : (
                    <button onClick={() => setEditingLink(true)}>Adicionar link da universidade</button>
                  )}
                </div>
              )}
            </div>
            <div className="action-buttons">
              <button onClick={() => setShowRecorder(true)} className="btn-primary">
                <FaMicrophone /> Nova Nota por Áudio
              </button>
              <label className="btn-primary">
                <FaUpload /> Gerar Notas de Arquivo
                <input type="file" onChange={handleFileUploadForNotes} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
          
          {showRecorder && (
            <div className="modal">
              <div className="modal-content">
                <h3>Gravar Áudio para Notas</h3>
                <select value={selectedMetodo} onChange={(e) => setSelectedMetodo(e.target.value)}>
                  <option value="cornell">Método Cornell</option>
                  <option value="esboço">Método Esboço</option>
                </select>
                <AudioRecorder 
                  notebookId={id} 
                  metodo={selectedMetodo}
                  onProcessed={handleAudioProcessed}
                />
                <button onClick={() => setShowRecorder(false)}>Fechar</button>
              </div>
            </div>
          )}
          
          <div className="paginas-list">
            <h2>Páginas</h2>
            {paginas.map(pagina => (
              <div key={pagina.id} className="pagina-card" onMouseUp={() => setCurrentPagina(pagina)}>
                <div className="pagina-header">
                  <h3>{pagina.titulo}</h3>
                  <button onClick={() => handleDeletePagina(pagina.id)} className="delete"><FaTrash /></button>
                </div>
                
                <div className="pagina-content">
                  <p>{pagina.conteudo}</p>
                </div>

                {destaques.filter(d => d.pagina_id === pagina.id).length > 0 && (
                  <div className="destaques-list">
                    <h4>Destaques</h4>
                    {destaques.filter(d => d.pagina_id === pagina.id).map(d => (
                      <div key={d.id} className="destaque-item" style={{ backgroundColor: d.cor }}>
                        <p>"{d.trecho}"</p>
                        {d.comentario && <small className="comentario">{d.comentario}</small>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {pdfs.length > 0 && (
            <div className="pdfs-section">
              <h3>PDFs deste caderno</h3>
              <div className="pdfs-list">
                {pdfs.map(pdf => (
                  <div key={pdf.id} className="pdf-item">
                    <span>{pdf.titulo}</span>
                    <DownloadButton filePath={pdf.arquivo_path} fileName={pdf.titulo + '.pdf'} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {podcasts.length > 0 && (
            <div className="podcasts-section">
              <h3>Podcasts deste caderno</h3>
              <div className="podcasts-list">
                {podcasts.map(pod => (
                  <div key={pod.id} className="podcast-item">
                    <span>{pod.titulo}</span>
                    <audio controls src={`${api.defaults.baseURL.replace('/api', '')}${pod.url}`} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showHighlightModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Adicionar Destaque</h3>
            <p><strong>Trecho:</strong> "{selectedText}"</p>
            <label>
              Cor:
              <input type="color" value={highlightColor} onChange={(e) => setHighlightColor(e.target.value)} />
            </label>
            <label>
              Comentário (opcional):
              <textarea value={highlightComment} onChange={(e) => setHighlightComment(e.target.value)} />
            </label>
            <div className="modal-actions">
              <button onClick={handleSaveHighlight}>Salvar</button>
              <button onClick={() => setShowHighlightModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotebookDetail;
