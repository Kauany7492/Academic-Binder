const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const notesRoutes = require('./routes/notes');
// ... outras rotas (auth, cadernos, etc.)

const app = express();

app.use(cors());
app.use(express.json());

// Configuração Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Academic Binder API',
      version: '1.0.0',
      description: 'API de anotações acadêmicas com múltiplos métodos',
    },
    servers: [{ url: 'http://localhost:3000/api' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js'], // caminho para os arquivos de rota
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rotas públicas
app.use('/api/auth', require('./routes/auth')(pool)); // pool deve ser injetado

// Rotas protegidas
app.use('/api/notes', notesRoutes);
// ... outras rotas protegidas (cadernos, pdfs, etc.)

module.exports = app;