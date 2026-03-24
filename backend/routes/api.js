const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');

module.exports = (pool) => {
  // Rotas públicas
  const authRouter = require('./auth')(pool);
  router.use('/auth', authRouter);

  // Todas as rotas abaixo requerem autenticação
  router.use(authenticate);

  // Recursos que dependem do pool
  router.use(require('./cadernos')(pool));
  router.use(require('./midia')(pool));
  router.use(require('./books')(pool));
  router.use(require('./drive')(pool));
  router.use(require('./planner')(pool));

  // Rota de anotações (não precisa do pool, pois o modelo Note importa o banco diretamente)
  const notesRoutes = require('./notes');
  router.use('/notes', notesRoutes);

  return router;
};