require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const pool = require('./config/database');

const app = express();
const port = process.env.PORT || 3000;

// ========== CONFIGURAÇÃO CORS ==========
const allowedOrigins = [
  'http://localhost:3001',                          
  'https://academic-binder.shop',                   
  'https://academic-binder-frontend.onrender.com',  
  'https://www.academic-binder.shop',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'A política CORS para este site não permite acesso a partir da origem especificada.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,                              
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ========== MIDDLEWARES ==========
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (uploads e áudios)
app.use('/uploads', express.static('uploads'));
app.use('/audio', express.static('audio'));

// ========== CRIAÇÃO DE DIRETÓRIOS ==========
const dirs = ['./uploads/podcasts', './uploads/pdfs', './audio', './uploads/temp'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ========== CONEXÃO COM O BANCO DE DADOS (TiDB / MySQL) ==========
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 4000,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  ssl: process.env.TIDB_ENABLE_SSL === 'true' ? { rejectUnauthorized: true } : undefined
});

// Teste de conexão
pool.getConnection()
  .then(connection => {
    console.log('✅ Conectado ao TiDB');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Erro de conexão com TiDB:', err.message);
    process.exit(1);
  });

// ========== ROTAS ==========
const apiRouter = require('./routes/api')(pool);
app.use('/api', apiRouter);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// ========== INICIALIZAÇÃO DO SERVIDOR ==========
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});