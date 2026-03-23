const express = require('express');
const router = express.Router();

module.exports = (pool) => {
  // Rotas públicas de autenticação (não requerem token)
  const authRouter = require('./auth')(pool);
  router.use('/auth', authRouter);

  // Todas as rotas abaixo requerem autenticação
  const authenticate = require('../middleware/authenticate');
  router.use(authenticate);

  // Importa os módulos de recursos, todos já protegidos e filtrados por user_id
  router.use(require('./cadernos')(pool));
  router.use(require('./midia')(pool));
  router.use(require('./books')(pool));
  router.use(require('./drive')(pool));
  router.use(require('./planner')(pool));

  return router;
};