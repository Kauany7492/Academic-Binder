const express = require('express');
const router = express.Router();

module.exports = (pool) => {
  // ========== CRUD CADERNOS ==========
  router.get('/cadernos', async (req, res) => {
  try {
    const { limit } = req.query;
    let query = 'SELECT * FROM cadernos ORDER BY created_at DESC';
    const params = [];
    if (limit) {
      query += ' LIMIT ?';
      params.push(parseInt(limit));
    }
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

  router.get('/cadernos/:id', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM cadernos WHERE id = ?', [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/cadernos', async (req, res) => {
    const { titulo, descricao, cor } = req.body;
    try {
      const [result] = await pool.query(
        'INSERT INTO cadernos (titulo, descricao, cor) VALUES (?, ?, ?)',
        [titulo, descricao, cor || '#3498db']
      );
      const [newRecord] = await pool.query('SELECT * FROM cadernos WHERE id = ?', [result.insertId]);
      res.status(201).json(newRecord[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/cadernos/:id', async (req, res) => {
    const { titulo, descricao, cor, link_universidade } = req.body;
    try {
      await pool.query(
        'UPDATE cadernos SET titulo = ?, descricao = ?, cor = ?, link_universidade = ? WHERE id = ?',
        [titulo, descricao, cor, link_universidade, req.params.id]
      );
      const [updated] = await pool.query('SELECT * FROM cadernos WHERE id = ?', [req.params.id]);
      res.json(updated[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/cadernos/:id', async (req, res) => {
    try {
      const [result] = await pool.query('DELETE FROM cadernos WHERE id = ?', [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ========== CRUD PÁGINAS ==========
  router.get('/cadernos/:cadernoId/paginas', async (req, res) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM paginas WHERE caderno_id = ? ORDER BY created_at DESC',
        [req.params.cadernoId]
      );
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/paginas', async (req, res) => {
    const { caderno_id, titulo, conteudo, metodo_anotacao } = req.body;
    try {
      const [result] = await pool.query(
        'INSERT INTO paginas (caderno_id, titulo, conteudo, metodo_anotacao) VALUES (?, ?, ?, ?)',
        [caderno_id, titulo, conteudo, metodo_anotacao]
      );
      const [newRecord] = await pool.query('SELECT * FROM paginas WHERE id = ?', [result.insertId]);
      res.status(201).json(newRecord[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/paginas/:id', async (req, res) => {
    const { titulo, conteudo, metodo_anotacao } = req.body;
    try {
      await pool.query(
        'UPDATE paginas SET titulo = ?, conteudo = ?, metodo_anotacao = ? WHERE id = ?',
        [titulo, conteudo, metodo_anotacao, req.params.id]
      );
      const [updated] = await pool.query('SELECT * FROM paginas WHERE id = ?', [req.params.id]);
      res.json(updated[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/paginas/:id', async (req, res) => {
    try {
      const [result] = await pool.query('DELETE FROM paginas WHERE id = ?', [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ========== DESTAQUES ==========
  router.get('/paginas/:paginaId/destaques', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM destaques WHERE pagina_id = ? ORDER BY id', [req.params.paginaId]);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/destaques', async (req, res) => {
    const { pagina_id, trecho, cor, comentario, posicao_inicio, posicao_fim } = req.body;
    try {
      const [result] = await pool.query(
        `INSERT INTO destaques (pagina_id, trecho, cor, comentario, posicao_inicio, posicao_fim)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [pagina_id, trecho, cor, comentario, posicao_inicio, posicao_fim]
      );
      const [newRecord] = await pool.query('SELECT * FROM destaques WHERE id = ?', [result.insertId]);
      res.status(201).json(newRecord[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/destaques/:id', async (req, res) => {
    try {
      const [result] = await pool.query('DELETE FROM destaques WHERE id = ?', [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ========== LINKS ==========
  router.get('/paginas/:paginaId/links', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM links WHERE pagina_id = ? ORDER BY id', [req.params.paginaId]);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/links', async (req, res) => {
    const { pagina_id, url, descricao } = req.body;
    try {
      const [result] = await pool.query(
        'INSERT INTO links (pagina_id, url, descricao) VALUES (?, ?, ?)',
        [pagina_id, url, descricao]
      );
      const [newRecord] = await pool.query('SELECT * FROM links WHERE id = ?', [result.insertId]);
      res.status(201).json(newRecord[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/links/:id', async (req, res) => {
    try {
      const [result] = await pool.query('DELETE FROM links WHERE id = ?', [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};