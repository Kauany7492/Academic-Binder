const express = require('express');
const router = express.Router();

module.exports = (pool) => {
  // ========== LEMBRETES (PLANNER) ==========
  router.get('/lembretes', async (req, res) => {
    try {
      const { caderno_id } = req.query;
      let query = 'SELECT * FROM lembretes';
      const params = [];
      if (caderno_id) {
        query += ' WHERE caderno_id = ?';
        params.push(caderno_id);
      }
      query += ' ORDER BY data_hora';
      const [rows] = await pool.query(query, params);
      res.json(rows);
    } catch (err) {
      console.error('Erro ao listar lembretes:', err);
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/lembretes', async (req, res) => {
    const { caderno_id, titulo, descricao, data_hora } = req.body;
    if (!titulo || !data_hora) {
      return res.status(400).json({ error: 'Título e data/hora são obrigatórios' });
    }
    try {
      // Converte a data para o formato MySQL (YYYY-MM-DD HH:MM:SS)
      const formattedDate = new Date(data_hora).toISOString().slice(0, 19).replace('T', ' ');
      const [result] = await pool.query(
        'INSERT INTO lembretes (caderno_id, titulo, descricao, data_hora) VALUES (?, ?, ?, ?)',
        [caderno_id || null, titulo, descricao || null, formattedDate]
      );
      const [newRecord] = await pool.query('SELECT * FROM lembretes WHERE id = ?', [result.insertId]);
      res.status(201).json(newRecord[0]);
    } catch (err) {
      console.error('Erro ao criar lembrete:', err);
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/lembretes/:id', async (req, res) => {
    const { titulo, descricao, data_hora, notificado } = req.body;
    try {
      const formattedDate = data_hora ? new Date(data_hora).toISOString().slice(0, 19).replace('T', ' ') : undefined;
      await pool.query(
        'UPDATE lembretes SET titulo = ?, descricao = ?, data_hora = ?, notificado = ? WHERE id = ?',
        [titulo, descricao, formattedDate, notificado, req.params.id]
      );
      const [updated] = await pool.query('SELECT * FROM lembretes WHERE id = ?', [req.params.id]);
      res.json(updated[0]);
    } catch (err) {
      console.error('Erro ao atualizar lembrete:', err);
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/lembretes/:id', async (req, res) => {
    try {
      const [result] = await pool.query('DELETE FROM lembretes WHERE id = ?', [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Lembrete não encontrado' });
      res.status(204).send();
    } catch (err) {
      console.error('Erro ao deletar lembrete:', err);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};