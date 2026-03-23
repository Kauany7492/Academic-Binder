const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 10;

class AuthService {
  /**
   * Gera o hash de uma senha
   * @param {string} password - Senha em texto puro
   * @returns {Promise<string>} Hash da senha
   */
  static async hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Compara uma senha com seu hash
   * @param {string} password - Senha em texto puro
   * @param {string} hash - Hash armazenado
   * @returns {Promise<boolean>} Verdadeiro se correspondem
   */
  static async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  /**
   * Gera um token de acesso JWT
   * @param {string} userId - ID do usuário
   * @returns {string} Token JWT
   */
  static generateAccessToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m'
    });
  }

  /**
   * Gera um refresh token JWT
   * @param {string} userId - ID do usuário
   * @returns {string} Refresh token JWT
   */
  static generateRefreshToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    });
  }

  /**
   * Verifica e decodifica um token de acesso
   * @param {string} token - Token JWT
   * @returns {object} Payload decodificado
   */
  static verifyAccessToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
  }

  /**
   * Verifica e decodifica um refresh token
   * @param {string} token - Refresh token JWT
   * @returns {object} Payload decodificado
   */
  static verifyRefreshToken(token) {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  }
}

module.exports = AuthService;