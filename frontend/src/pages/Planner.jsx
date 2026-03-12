import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import api from '../services/api';
import { FaPlus, FaTrash } from 'react-icons/fa';
import './Planner.css';

const Planner = () => {
  const [lembretes, setLembretes] = useState([]);
  const [showLembreteModal, setShowLembreteModal] = useState(false);
  const [novoLembrete, setNovoLembrete] = useState({ titulo: '', descricao: '', data_hora: '', caderno_id: '' });
  const [cadernos, setCadernos] = useState([]);
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    fetchLembretes();
    fetchCadernos();
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const timeouts = [];
    lembretes.forEach(lembrete => {
      if (!lembrete.notificado) {
        const agora = new Date();
        const dataLembrete = new Date(lembrete.data_hora);
        const diff = dataLembrete - agora;
        if (diff > 0 && diff < 24 * 60 * 60 * 1000) {
          const timeout = setTimeout(() => {
            new Notification(lembrete.titulo, { body: lembrete.descricao });
            api.put(`/lembretes/${lembrete.id}`, { notificado: true });
          }, diff);
          timeouts.push(timeout);
        }
      }
    });
    return () => timeouts.forEach(clearTimeout);
  }, [lembretes]);

  const fetchLembretes = async () => {
    try {
      const res = await api.get('/lembretes');
      setLembretes(res.data);
    } catch (error) {
      console.error(error);
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

  const handleAddLembrete = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/lembretes', novoLembrete);
      setLembretes([...lembretes, res.data]);
      setShowLembreteModal(false);
      setNovoLembrete({ titulo: '', descricao: '', data_hora: '', caderno_id: '' });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Excluir lembrete?')) {
      try {
        await api.delete(`/lembretes/${id}`);
        setLembretes(lembretes.filter(l => l.id !== id));
      } catch (error) {
        console.error(error);
      }
    }
  };

  const lembretesDoDia = lembretes.filter(l =>
    new Date(l.data_hora).toDateString() === date.toDateString()
  );

  return (
    <div className="planner-container">
      <h1>Planner</h1>
      <button onClick={() => setShowLembreteModal(true)} className="btn-primary">
        <FaPlus /> Novo Lembrete
      </button>

      <div className="planner-grid">
        <div className="calendar-section">
          <h2>Calendário</h2>
          <Calendar onChange={setDate} value={date} />
          <div className="day-lembretes">
            <h3>Lembretes em {date.toLocaleDateString()}</h3>
            {lembretesDoDia.length > 0 ? (
              <ul>
                {lembretesDoDia.map(l => (
                  <li key={l.id}>
                    <strong>{l.titulo}</strong>: {l.descricao}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nenhum lembrete para este dia.</p>
            )}
          </div>
        </div>

        <div className="lembretes-section">
          <h2>Todos os Lembretes</h2>
          <div className="lembretes-list">
            {lembretes.map(l => (
              <div key={l.id} className="lembrete-item">
                <div>
                  <strong>{l.titulo}</strong> - {new Date(l.data_hora).toLocaleString()}
                  <p>{l.descricao}</p>
                </div>
                <button onClick={() => handleDelete(l.id)} className="delete"><FaTrash /></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showLembreteModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Novo Lembrete</h3>
            <form onSubmit={handleAddLembrete}>
              <label>
                Título:
                <input
                  type="text"
                  value={novoLembrete.titulo}
                  onChange={(e) => setNovoLembrete({...novoLembrete, titulo: e.target.value})}
                  required
                />
              </label>
              <label>
                Descrição:
                <textarea
                  value={novoLembrete.descricao}
                  onChange={(e) => setNovoLembrete({...novoLembrete, descricao: e.target.value})}
                />
              </label>
              <label>
                Data e Hora:
                <input
                  type="datetime-local"
                  value={novoLembrete.data_hora}
                  onChange={(e) => setNovoLembrete({...novoLembrete, data_hora: e.target.value})}
                  required
                />
              </label>
              <label>
                Caderno relacionado (opcional):
                <select
                  value={novoLembrete.caderno_id}
                  onChange={(e) => setNovoLembrete({...novoLembrete, caderno_id: e.target.value})}
                >
                  <option value="">Nenhum</option>
                  {cadernos.map(c => <option key={c.id} value={c.id}>{c.titulo}</option>)}
                </select>
              </label>
              <div className="modal-actions">
                <button type="submit">Salvar</button>
                <button type="button" onClick={() => setShowLembreteModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Planner;
