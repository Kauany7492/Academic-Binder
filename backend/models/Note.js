const pool = require('../config/database');

class Note {
  static async create({ userId, type, title, content, fileRef }) {
    const [result] = await pool.query(
      `INSERT INTO notes (user_id, type, title, content, file_ref)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, type, title, JSON.stringify(content), fileRef || null]
    );
    return this.findById(result.insertId, userId);
  }

  static async findById(id, userId) {
    const [rows] = await pool.query(
      `SELECT * FROM notes WHERE id = ? AND user_id = ?`,
      [id, userId]
    );
    return rows[0];
  }

  static async findAll({ userId, type, limit = 50, offset = 0 }) {
    let query = 'SELECT * FROM notes WHERE user_id = ?';
    const params = [userId];
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async update(id, userId, updates) {
    const allowed = ['title', 'content', 'type'];
    const setClauses = [];
    const values = [];
    for (const field of allowed) {
      if (updates[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        values.push(field === 'content' ? JSON.stringify(updates[field]) : updates[field]);
      }
    }
    if (setClauses.length === 0) return null;
    values.push(id, userId);
    const query = `UPDATE notes SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = ? AND user_id = ?`;
    const [result] = await pool.query(query, values);
    if (result.affectedRows === 0) return null;
    return this.findById(id, userId);
  }

  static async delete(id, userId) {
    const [result] = await pool.query('DELETE FROM notes WHERE id = ? AND user_id = ?', [id, userId]);
    return result.affectedRows > 0;
  }
}

module.exports = Note;