const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const pool = require('../config/database'); // seu pool de conexão

// Limite de tentativas para evitar ataques de força bruta
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  skipSuccessfulRequests: true,
  message: { error: 'Muitas tentativas, tente novamente mais tarde.' }
});

// Funções auxiliares (podem estar em um serviço separado)
const hashPassword = async (password) => bcrypt.hash(password, 10);
const generateAccessToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
const generateRefreshToken = (userId) => jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

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

    // Hash da senha
    const passwordHash = await hashPassword(password);

    // Inserir usuário
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, passwordHash]
    );
    const userId = result.insertId;

    // Gerar tokens
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    // Retornar dados do usuário e tokens
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

module.exports = router;