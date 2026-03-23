const express = require('express');
const router = express.Router();

module.exports = (pool) => {
  router.get('/lembretes', async (req, res) => {
    try {
      let query = 'SELECT * FROM lembretes WHERE user_id = ?';
      const params = [req.user.id];
      const { caderno_id } = req.query;
      if (caderno_id) {
        query += ' AND caderno_id = ?';
        params.push(caderno_id);
      }
      query += ' ORDER BY data_hora';
      const [rows] = await pool.query(query, params);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/lembretes', async (req, res) => {
    const { caderno_id, titulo, descricao, data_hora } = req.body;
    if (!titulo || !data_hora) {
      return res.status(400).json({ error: 'Título e data/hora são obrigatórios' });
    }
    try {
      if (caderno_id) {
        const [caderno] = await pool.query('SELECT id FROM cadernos WHERE id = ? AND user_id = ?', [caderno_id, req.user.id]);
        if (caderno.length === 0) return res.status(404).json({ error: 'Caderno não encontrado' });
      }
      const formattedDate = new Date(data_hora).toISOString().slice(0, 19).replace('T', ' ');
      const [result] = await pool.query(
        'INSERT INTO lembretes (caderno_id, titulo, descricao, data_hora, user_id) VALUES (?, ?, ?, ?, ?)',
        [caderno_id || null, titulo, descricao || null, formattedDate, req.user.id]
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
      const [existing] = await pool.query('SELECT id FROM lembretes WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
      if (existing.length === 0) return res.status(404).json({ error: 'Lembrete não encontrado' });
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
      const [result] = await pool.query('DELETE FROM lembretes WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Lembrete não encontrado' });
      res.status(204).send();
    } catch (err) {
      console.error('Erro ao deletar lembrete:', err);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};