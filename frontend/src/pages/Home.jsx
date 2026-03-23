import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import './Home.css';

const Home = () => {
  const [recentNotebooks, setRecentNotebooks] = useState([]);
  const [recentPDFs, setRecentPDFs] = useState([]);
  const [recentPodcasts, setRecentPodcasts] = useState([]);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecentItems();
    fetchStats();
  }, []);

  const fetchRecentItems = async () => {
    setLoading(true);
    try {
      // Buscar cadernos recentes (últimos 3)
      const notebooksRes = await api.get('/cadernos?limit=3');
      console.log('Notebooks recentes:', notebooksRes.data);
      setRecentNotebooks(notebooksRes.data);

      // Buscar PDFs recentes (últimos 3)
      const pdfsRes = await api.get('/pdfs?limit=3');
      setRecentPDFs(pdfsRes.data);

      // Buscar podcasts gerados recentes (últimos 3)
      const podcastsRes = await api.get('/podcasts-gerados?limit=3');
      setRecentPodcasts(podcastsRes.data);

      setError(null);
    } catch (error) {
      console.error('Erro ao buscar dados recentes:', error);
      setError('Não foi possível carregar os itens recentes. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await api.get('/stats');
      setStats(res.data);
      setStatsError(null);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      setStatsError('Não foi possível carregar as estatísticas de leitura.');
    } finally {
      setStatsLoading(false);
    }
  };

  const chartData = stats?.weekly?.map(item => ({
    date: format(parseISO(item.date), 'dd/MM'),
    pages: parseInt(item.total_pages) || 0
  })) || [];

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="home-container">
      <h1 className="page-title">Academic Binder</h1>

      <section className="reading-stats">
        <h2>📊 Estatísticas de Leitura</h2>
        {statsLoading && <p>Carregando estatísticas...</p>}
        {statsError && <p className="error">{statsError}</p>}
        {stats && !statsLoading && (
          <div className="stats-grid">
            <div className="stats-card">
              <h3>Progresso Diário (Últimos 7 dias)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="pages" stroke="#5D86AA" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="stats-card comparison">
              <h3>Livros Concluídos</h3>
              <div className="comparison-numbers">
                <div>
                  <span className="label">Mês Atual</span>
                  <span className="value">{stats.currentMonthCompleted}</span>
                </div>
                <div>
                  <span className="label">Mês Anterior</span>
                  <span className="value">{stats.previousMonthCompleted}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

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