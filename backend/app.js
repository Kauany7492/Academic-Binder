const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');
const apiRoutes = require('./routes/api');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (uploads, áudios)
app.use('/uploads', express.static('uploads'));
app.use('/audio', express.static('audio'));

// Configuração Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Academic Binder API',
      version: '1.0.0',
      description: 'API de anotações acadêmicas com múltiplos métodos',
    },
    servers: [{ url: 'https://academic-binderai-api.onrender.com/api' }], // ajuste conforme ambiente
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
  apis: ['./routes/*.js'], // caminho relativo ao diretório onde o swagger é executado
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Conexão com o banco (assumindo que você tem um pool exportado de config/database.js)
const pool = require('./config/database'); // ajuste conforme seu arquivo

// Rotas da API – passando o pool para quem precisa
app.use('/api', apiRoutes(pool));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

module.exports = app;