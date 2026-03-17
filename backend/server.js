// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static('uploads'));
app.use('/audio', express.static('audio'));

const dirs = ['./uploads/podcasts', './uploads/pdfs', './audio', './uploads/temp'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Configuração do pool de conexões para TiDB (MySQL compatível)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 4000,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ssl: process.env.TIDB_ENABLE_SSL === 'true' ? {
    rejectUnauthorized: true,
    minVersion: 'TLSv1.2'
  } : undefined
});

// Testar conexão
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conectado ao TiDB com sucesso!');
    connection.release();
  } catch (err) {
    console.error('❌ Erro ao conectar ao TiDB:', err.message);
  }
}
testConnection();

// Rotas da API
app.use('/api', require('./routes/api')(pool));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
