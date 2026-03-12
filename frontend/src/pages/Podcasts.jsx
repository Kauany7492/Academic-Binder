import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { FaPlay, FaPause, FaTrash, FaUpload, FaRobot, FaList, FaDownload } from 'react-icons/fa';
import './Podcasts.css';

const Podcasts = () => {
  const [podcasts, setPodcasts] = useState([]);
  const [podcastsGerados, setPodcastsGerados] = useState([]);
  const [playing, setPlaying] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [cadernos, setCadernos] = useState([]);
  const [selectedCaderno, setSelectedCaderno] = useState('');
  const [generating, setGenerating] = useState(false);
  const [selectedPodcast, setSelectedPodcast] = useState(null);
  const [fileForPodcast, setFileForPodcast] = useState(null);
  const audioRef = useRef(new Audio());

  useEffect(() => {
    fetchPodcasts();
    fetchPodcastsGerados();
    fetchCadernos();
  }, []);

  const fetchPodcasts = async () => {
    try {
      const res = await api.get('/podcasts');
      setPodcasts(res.data);
    } catch (error) {
      console.error('Erro ao carregar podcasts:', error);
    }
  };

  const fetchPodcastsGerados = async () => {
    try {
      const res = await api.get('/podcasts-gerados');
      setPodcastsGerados(res.data);
    } catch (error) {
      console.error('Erro ao carregar podcasts gerados:', error);
    }
  };

  const fetchCadernos = async () => {
    try {
      const res = await api.get('/cadernos');
      setCadernos(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handlePlay = (podcast, isGerado = false) => {
    if (playing === podcast.id) {
      audioRef.current.pause();
      setPlaying(null);
    } else {
      if (isGerado && podcast.roteiro) {
        setSelectedPodcast(podcast);
      } else {
        const url = `${api.defaults.baseURL.replace('/api', '')}${podcast.url}`;
        audioRef.current.src = url;
        audioRef.current.play();
        setPlaying(podcast.id);
      }
    }
  };

  const handleGenerateFromFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('caderno_id', selectedCaderno || '');
    formData.append('summarize', 'true');
    formData.append('titulo', `Podcast: ${file.name}`);

    try {
      setGenerating(true);
      const res = await api.post('/gerar-podcast', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchPodcastsGerados();
      setSelectedPodcast(res.data.podcast);
      setShowGenerator(false);
    } catch (error) {
      console.error('Erro ao gerar podcast:', error);
      alert('Erro ao gerar podcast. Verifique o arquivo.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteGerado = async (id) => {
    if (window.confirm('Excluir este podcast gerado?')) {
      try {
        await api.delete(`/podcasts-gerados/${id}`);
        fetchPodcastsGerados();
        if (selectedPodcast?.id === id) setSelectedPodcast(null);
      } catch (error) {
        console.error('Erro ao deletar:', error);
      }
    }
  };

  const handleDeleteEnviado = async (id) => {
    if (window.confirm('Excluir podcast?')) {
      try {
        await api.delete(`/podcasts/${id}`);
        fetchPodcasts();
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="page-container">
      <h1>Podcasts</h1>
      
      <div className="podcasts-header">
        <div className="upload-area">
          <label htmlFor="podcast-upload" className="btn-primary">
            <FaUpload /> {uploading ? 'Enviando...' : 'Upload Podcast'}
          </label>
          <input
            id="podcast-upload"
            type="file"
            accept="audio/*"
            onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;
              const formData = new FormData();
              formData.append('audio', file);
              formData.append('titulo', file.name);
              formData.append('caderno_id', '');
              try {
                setUploading(true);
                await api.post('/podcasts', formData);
                fetchPodcasts();
              } catch (error) {
                console.error(error);
              } finally {
                setUploading(false);
              }
            }}
            style={{ display: 'none' }}
          />
        </div>

        <button onClick={() => setShowGenerator(true)} className="btn-secondary">
          <FaRobot /> Gerar Podcast com IA
        </button>
      </div>

      {showGenerator && (
        <div className="modal">
          <div className="modal-content large">
            <h2>Gerar Podcast com IA</h2>
            <div className="generator-options">
              <label>
                Caderno (opcional):
                <select value={selectedCaderno} onChange={(e) => setSelectedCaderno(e.target.value)}>
                  <option value="">Nenhum</option>
                  {cadernos.map(c => <option key={c.id} value={c.id}>{c.titulo}</option>)}
                </select>
              </label>
              <label>
                Arquivo (PDF, DOCX, TXT):
                <input type="file" accept=".pdf,.docx,.txt" onChange={(e) => setFileForPodcast(e.target.files[0])} />
              </label>
              {fileForPodcast && (
                <button 
                  onClick={handleGenerateFromFile} 
                  disabled={generating}
                  className="btn-primary"
                >
                  {generating ? 'Gerando...' : 'Gerar Podcast'}
                </button>
              )}
            </div>
            <button onClick={() => setShowGenerator(false)} className="btn-close">Fechar</button>
          </div>
        </div>
      )}

      <div className="podcasts-section">
        <h2><FaRobot /> Podcasts Gerados por IA</h2>
        <div className="podcasts-grid">
          {podcastsGerados.map(pod => (
            <div key={pod.id} className="podcast-card generated">
              <h3>{pod.titulo}</h3>
              <p className="descricao">{pod.descricao}</p>
              <div className="podcast-meta">
                <span>📚 {pod.total_episodios || 1} episódio(s)</span>
                <span>⏱️ {Math.floor(pod.duracao_estimada / 60)} min</span>
              </div>
              <div className="podcast-actions">
                <button onClick={() => handlePlay(pod, true)}>
                  <FaList /> Ver Roteiro
                </button>
                {pod.url_audio && (
                  <a href={`${api.defaults.baseURL.replace('/api', '')}${pod.url_audio}`} download>
                    <FaDownload /> Download
                  </a>
                )}
                <button onClick={() => handleDeleteGerado(pod.id)} className="delete">
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedPodcast && (
        <div className="modal">
          <div className="modal-content large">
            <h2>{selectedPodcast.titulo}</h2>
            <div className="podcast-roteiro">
              <pre>{selectedPodcast.roteiro}</pre>
            </div>
            <div className="modal-actions">
              <button onClick={() => setSelectedPodcast(null)} className="btn-primary">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="podcasts-section">
        <h2><FaUpload /> Podcasts Enviados</h2>
        <div className="podcasts-list">
          {podcasts.map(pod => (
            <div key={pod.id} className="podcast-item">
              <div className="podcast-info">
                <h3>{pod.titulo}</h3>
                <button onClick={() => handlePlay(pod)}>
                  {playing === pod.id ? <FaPause /> : <FaPlay />}
                </button>
              </div>
              {pod.resumo_ia && <p className="resumo">{pod.resumo_ia}</p>}
              <div className="podcast-actions">
                <a href={`${api.defaults.baseURL.replace('/api', '')}${pod.url}`} download>
                  <FaDownload /> Download
                </a>
                <button onClick={() => handleDeleteEnviado(pod.id)} className="delete">
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Podcasts;
