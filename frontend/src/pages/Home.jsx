import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Home = () => {
  const [recentNotebooks, setRecentNotebooks] = useState([]);
  const [recentPDFs, setRecentPDFs] = useState([]);
  const [recentPodcasts, setRecentPodcasts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const notebooksRes = await api.get('/cadernos?limit=3');
        setRecentNotebooks(notebooksRes.data);
        
        const pdfsRes = await api.get('/pdfs?limit=3');
        setRecentPDFs(pdfsRes.data);
        
        const podcastsRes = await api.get('/podcasts-gerados?limit=3');
        setRecentPodcasts(podcastsRes.data);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      }
    };
    
    fetchData();
  }, []);

  return (
    <div className="page-container">
      <h1 className="page-title">Academic Binder</h1>
      
      <section className="quick-access">
        <h2>Acesso Rápido</h2>
        
        <div className="section">
          <h3>Notebooks Recentes</h3>
          {recentNotebooks.length > 0 ? (
            <div className="cards-grid">
              {recentNotebooks.map(notebook => (
                <Link to={`/notebooks/${notebook.id}`} key={notebook.id} className="card">
                  <h4>{notebook.titulo}</h4>
                  <p>{notebook.descricao}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="empty-message">Nenhum notebook ainda</p>
          )}
          <Link to="/notebooks" className="view-all">Ver todos →</Link>
        </div>
        
        <div className="section">
          <h3>PDFs Recentes</h3>
          {recentPDFs.length > 0 ? (
            <div className="cards-grid">
              {recentPDFs.map(pdf => (
                <div key={pdf.id} className="card">
                  <h4>{pdf.titulo}</h4>
                  {pdf.resumo_ia && <p>{pdf.resumo_ia.substring(0, 100)}...</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-message">Nenhum PDF ainda</p>
          )}
          <Link to="/pdfs" className="view-all">Ver todos →</Link>
        </div>
        
        <div className="section">
          <h3>Podcasts Recentes</h3>
          {recentPodcasts.length > 0 ? (
            <div className="cards-grid">
              {recentPodcasts.map(pod => (
                <div key={pod.id} className="card">
                  <h4>{pod.titulo}</h4>
                  <p>{pod.descricao}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-message">Nenhum podcast ainda</p>
          )}
          <Link to="/podcasts" className="view-all">Ver todos →</Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
