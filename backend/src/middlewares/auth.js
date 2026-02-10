const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');

    const result = await pool.query(
      'SELECT id, nome, ativo FROM funcionario WHERE id = ?',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    if (!result.rows[0].ativo) {
      return res.status(401).json({ error: 'Usuário inativo' });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      nome: result.rows[0].nome,
      is_admin: decoded.is_admin || 0,
      is_gestor: decoded.is_gestor || 0
    };

    next();
  } catch (error) {
    console.error('Erro na autenticação:', error.message);
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (!req.user?.is_admin) {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }
  next();
};

const gestorMiddleware = (req, res, next) => {
  if (!req.user?.is_gestor && !req.user?.is_admin) {
    return res.status(403).json({ error: 'Acesso restrito a gestores' });
  }
  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  gestorMiddleware
};
