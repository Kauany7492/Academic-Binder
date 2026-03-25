const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate'); // ajuste o caminho se necessário

module.exports = (pool) => {
  // Rotas públicas
  const authRouter = require('./auth')(pool);
  router.use('/auth', authRouter);

  // Middleware de autenticação – aplicado a todas as rotas abaixo
  router.use(authenticate);

  // Recursos que dependem do pool
  router.use(require('./cadernos')(pool));
  router.use(require('./midia')(pool));
  router.use(require('./books')(pool));
  router.use(require('./drive')(pool));
  router.use(require('./planner')(pool));

  // Rota de anotações (não precisa do pool, pois o modelo importa diretamente)
  const notesRoutes = require('./notes');
  router.use('/notes', notesRoutes);

  return router;
};