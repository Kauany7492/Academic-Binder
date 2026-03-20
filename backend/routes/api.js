const express = require('express');
const router = express.Router();

module.exports = (pool) => {
  // Importa cada submódulo, passando o pool
  router.use(require('./cadernos')(pool));
  router.use(require('./midia')(pool));
  router.use(require('./books')(pool));
  router.use(require('./drive')(pool));
  router.use(require('./planner')(pool)); // <-- adicionado

  return router;
};