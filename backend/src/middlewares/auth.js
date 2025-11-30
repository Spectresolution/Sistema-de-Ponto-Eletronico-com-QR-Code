const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token de acesso não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    
    const result = await pool.query(
      'SELECT id, nome, email, is_admin, is_gestor, ativo FROM funcionario WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0 || !result.rows[0].ativo) {
      return res.status(401).json({ error: 'Usuário não encontrado ou inativo' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (!req.user.is_admin) {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }
  next();
};

const gestorMiddleware = (req, res, next) => {
  if (!req.user.is_admin && !req.user.is_gestor) {
    return res.status(403).json({ error: 'Acesso restrito a gestores' });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware, gestorMiddleware };