const express = require('express');
const router = express.Router();

// Importe o middleware de autenticação (certifique-se de que o caminho está correto)
const authenticate = require('../middleware/authenticate');

module.exports = (pool) => {
  try {
    // Rotas públicas
    const authRouter = require('./auth')(pool);
    router.use('/auth', authRouter);

    // Middleware de autenticação – todas as rotas abaixo serão protegidas
    router.use(authenticate);

    // Recursos que dependem do pool (verifique se cada arquivo exporta uma função)
    router.use(require('./cadernos')(pool));
    router.use(require('./midia')(pool));
    router.use(require('./books')(pool));
    router.use(require('./drive')(pool));
    router.use(require('./planner')(pool));

    // Rota de anotações (exporta um router diretamente, não precisa do pool)
    const notesRoutes = require('./notes');
    router.use('/notes', notesRoutes);

    return router;
  } catch (err) {
    console.error('Erro ao carregar rotas:', err);
    throw err;
  }
};