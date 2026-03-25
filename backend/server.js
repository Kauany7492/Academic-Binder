require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const pool = require('./config/database'); // <-- importa o pool centralizado

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (uploads e áudios)
app.use('/uploads', express.static('uploads'));
app.use('/audio', express.static('audio'));

// Criar diretórios necessários (se não existirem)
const dirs = ['./uploads/podcasts', './uploads/pdfs', './audio', './uploads/temp'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Teste de conexão com o banco (opcional, mas útil)
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conectado ao TiDB com sucesso!');
    connection.release();
  } catch (err) {
    console.error('❌ Erro ao conectar ao TiDB:', err.message);
    // Não encerra o processo, mas o erro fica visível nos logs
  }
})();

// Rotas
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes(pool));

// Health check (obrigatório para o Render)
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});