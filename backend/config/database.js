const mysql = require('mysql2/promise');
require('dotenv').config();

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

// Teste de conectividade imediato
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conectado ao TiDB com sucesso!');
    connection.release();
  } catch (err) {
    console.error('❌ Erro ao conectar ao TiDB:', err.message);
  }
})();

module.exports = pool;