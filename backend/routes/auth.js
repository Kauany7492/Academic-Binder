const express = require('express');
const router = express.Router();
const AuthService = require('../services/auth.service');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Limite de tentativas para evitar ataques de força bruta
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo de 5 tentativas
  skipSuccessfulRequests: true,
  message: { error: 'Muitas tentativas, tente novamente mais tarde.' }
});

module.exports = (pool) => {
  // ========== REGISTRO ==========
  router.post('/register', limiter, [
    body('name').notEmpty().withMessage('Nome obrigatório'),
    body('email').isEmail().withMessage('E-mail inválido'),
    body('password').isLength({ min: 8 }).withMessage('Senha deve ter no mínimo 8 caracteres')
      .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Senha deve conter letras e números'),
    body('confirmPassword').custom((value, { req }) => value === req.body.password)
      .withMessage('Senhas não conferem')
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // Verificar se e-mail já existe
      const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
      if (existing.length) {
        return res.status(409).json({ error: 'E-mail já cadastrado' });
      }

      const passwordHash = await AuthService.hashPassword(password);
      const [result] = await pool.query(
        'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
        [name, email, passwordHash]
      );
      const userId = result.insertId;

      const accessToken = AuthService.generateAccessToken(userId);
      const refreshToken = AuthService.generateRefreshToken(userId);

      res.status(201).json({
        user: { id: userId, name, email },
        accessToken,
        refreshToken
      });
    } catch (err) {
      console.error('Erro no registro:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // ========== LOGIN ==========
  router.post('/login', limiter, [
    body('email').isEmail(),
    body('password').notEmpty()
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      if (users.length === 0) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const user = users[0];
      const isValid = await AuthService.comparePassword(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const accessToken = AuthService.generateAccessToken(user.id);
      const refreshToken = AuthService.generateRefreshToken(user.id);

      res.json({
        user: { id: user.id, name: user.name, email: user.email },
        accessToken,
        refreshToken
      });
    } catch (err) {
      console.error('Erro no login:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // ========== REFRESH TOKEN ==========
  router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token não fornecido' });
    }

    try {
      const decoded = AuthService.verifyRefreshToken(refreshToken);
      const userId = decoded.userId;

      // Opcional: verificar se o refresh token ainda é válido (ex: em uma blacklist)
      const newAccessToken = AuthService.generateAccessToken(userId);
      res.json({ accessToken: newAccessToken });
    } catch (err) {
      res.status(401).json({ error: 'Refresh token inválido ou expirado' });
    }
  });

  // ========== LOGOUT (simples) ==========
  router.post('/logout', async (req, res) => {
    // Em uma implementação mais completa, você poderia invalidar o refresh token
    // armazenando-o em uma tabela de tokens revogados.
    res.json({ message: 'Logout realizado' });
  });

  // ========== OBTER DADOS DO USUÁRIO AUTENTICADO ==========
  router.get('/me', async (req, res) => {
    // Este endpoint deve ser protegido, mas o middleware de autenticação será aplicado no api.js
    // A implementação fica no arquivo principal (ou aqui, mas usamos o middleware)
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Não autenticado' });

    try {
      const [users] = await pool.query('SELECT id, name, email FROM users WHERE id = ?', [userId]);
      if (users.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
      res.json(users[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};