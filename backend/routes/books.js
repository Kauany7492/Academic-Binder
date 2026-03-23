const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

module.exports = (pool) => {
  // ========== BOOKS CRUD ==========
  // Listar todos os livros do usuário (com filtro opcional de status)
  router.get('/books', async (req, res) => {
    try {
      const { status } = req.query;
      let query = 'SELECT * FROM books WHERE user_id = ?';
      const params = [req.user.id];
      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }
      query += ' ORDER BY updated_at DESC';
      const [rows] = await pool.query(query, params);
      res.json(rows);
    } catch (err) {
      console.error('Erro ao listar livros:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Buscar um livro específico
  router.get('/books/:id', async (req, res) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM books WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Livro não encontrado' });
      }
      res.json(rows[0]);
    } catch (err) {
      console.error('Erro ao buscar livro:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Criar um novo livro
  router.post('/books', async (req, res) => {
    const { title, author, total_pages, status = 'quero ler', start_date, end_date } = req.body;

    // Validações
    if (!title || !total_pages) {
      return res.status(400).json({ error: 'Título e total de páginas são obrigatórios' });
    }
    if (total_pages <= 0) {
      return res.status(400).json({ error: 'Total de páginas deve ser maior que zero' });
    }
    if (status && !['quero ler', 'lendo', 'lido'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const id = uuidv4();
    try {
      await pool.query(
        `INSERT INTO books (id, title, author, total_pages, pages_read, status, start_date, end_date, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, title, author, total_pages, 0, status, start_date || null, end_date || null, req.user.id]
      );
      const [newRecord] = await pool.query('SELECT * FROM books WHERE id = ?', [id]);
      res.status(201).json(newRecord[0]);
    } catch (err) {
      console.error('Erro ao criar livro:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Atualizar um livro
  router.put('/books/:id', async (req, res) => {
    const { title, author, total_pages, pages_read, status, start_date, end_date } = req.body;
    try {
      // Verificar se o livro pertence ao usuário
      const [current] = await pool.query(
        'SELECT * FROM books WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id]
      );
      if (current.length === 0) {
        return res.status(404).json({ error: 'Livro não encontrado' });
      }

      const currentBook = current[0];
      const updatedPagesRead = pages_read !== undefined ? pages_read : currentBook.pages_read;
      const updatedTotal = total_pages || currentBook.total_pages;
      if (updatedPagesRead > updatedTotal) {
        return res.status(400).json({ error: 'Páginas lidas não podem exceder o total' });
      }

      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        await connection.query(
          `UPDATE books SET
            title = COALESCE(?, title),
            author = COALESCE(?, author),
            total_pages = COALESCE(?, total_pages),
            pages_read = COALESCE(?, pages_read),
            status = COALESCE(?, status),
            start_date = COALESCE(?, start_date),
            end_date = COALESCE(?, end_date)
          WHERE id = ? AND user_id = ?`,
          [
            title || currentBook.title,
            author || currentBook.author,
            updatedTotal,
            updatedPagesRead,
            status || currentBook.status,
            start_date !== undefined ? start_date : currentBook.start_date,
            end_date !== undefined ? end_date : currentBook.end_date,
            req.params.id,
            req.user.id
          ]
        );

        // Se houve alteração nas páginas lidas, registrar no histórico
        if (pages_read !== undefined && pages_read !== currentBook.pages_read) {
          await connection.query(
            'INSERT INTO reading_history (book_id, pages_read) VALUES (?, ?)',
            [req.params.id, pages_read]
          );
        }

        await connection.commit();
        const [updated] = await pool.query('SELECT * FROM books WHERE id = ?', [req.params.id]);
        res.json(updated[0]);
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } catch (err) {
      console.error('Erro ao atualizar livro:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Excluir um livro
  router.delete('/books/:id', async (req, res) => {
    try {
      const [result] = await pool.query(
        'DELETE FROM books WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Livro não encontrado' });
      }
      res.status(204).send();
    } catch (err) {
      console.error('Erro ao deletar livro:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // ========== ESTATÍSTICAS DE LEITURA ==========
  router.get('/stats', async (req, res) => {
    try {
      // Progresso diário dos últimos 7 dias (apenas livros do usuário)
      const [weeklyProgress] = await pool.query(`
        SELECT
            DATE(rh.created_at) as date,
            SUM(rh.pages_read) as total_pages
        FROM reading_history rh
        INNER JOIN books b ON rh.book_id = b.id
        WHERE b.user_id = ?
          AND rh.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(rh.created_at)
        ORDER BY date
      `, [req.user.id]);

      // Livros concluídos no mês atual
      const [currentMonth] = await pool.query(`
        SELECT COUNT(*) as count
        FROM books
        WHERE user_id = ?
          AND status = 'lido'
          AND MONTH(updated_at) = MONTH(CURDATE())
          AND YEAR(updated_at) = YEAR(CURDATE())
      `, [req.user.id]);

      // Livros concluídos no mês anterior
      const [previousMonth] = await pool.query(`
        SELECT COUNT(*) as count
        FROM books
        WHERE user_id = ?
          AND status = 'lido'
          AND MONTH(updated_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
          AND YEAR(updated_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
      `, [req.user.id]);

      res.json({
        weekly: weeklyProgress,
        currentMonthCompleted: currentMonth[0].count,
        previousMonthCompleted: previousMonth[0].count
      });
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};