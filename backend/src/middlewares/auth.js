  const jwt = require('jsonwebtoken');
  const { pool } = require('../config/database');

  const authMiddleware = async (req, res, next) => {
    try {
      console.log('🔍 Verificando autenticação...');
      
      // Pegar token do header
      const authHeader = req.header('Authorization');
      console.log('🎫 Authorization Header:', authHeader);
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('❌ Token não fornecido ou formato inválido');
        return res.status(401).json({ error: 'Token de acesso não fornecido. Use: Bearer <token>' });
      }
      
      const token = authHeader.substring(7); // Remove "Bearer " - CORREÇÃO AQUI!
      console.log('🔑 Token (início):', token.substring(0, 30) + '...');
      
      // Verificar token JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
      console.log('✅ Token decodificado:', decoded);
      
      // Buscar usuário no banco - CORREÇÃO: usar pool.query() direto
      const result = await pool.query(
        'SELECT id, nome, email, is_admin, is_gestor, ativo FROM funcionario WHERE id = ?',
        [decoded.id]
      );
      
      console.log('📊 Resultado da query:', result.rows.length, 'usuário(s) encontrado(s)');
      
      if (result.rows.length === 0) {
        console.log('❌ Usuário não encontrado no banco');
        return res.status(401).json({ error: 'Usuário não encontrado' });
      }
      
      const user = result.rows[0];
      console.log('👤 Usuário encontrado:', user.email, 'Ativo:', user.ativo);
      
      if (!user.ativo) {
        console.log('❌ Usuário inativo');
        return res.status(401).json({ error: 'Usuário inativo' });
      }
      
      req.user = user;
      console.log('✅ Autenticação bem-sucedida!');
      next();
    } catch (error) {
      console.error('❌ Erro no middleware de autenticação:', error.message);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Token inválido' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expirado' });
      }
      
      res.status(500).json({ error: 'Erro interno do servidor na autenticação' });
    }
  };

  const adminMiddleware = (req, res, next) => {
    console.log('🔐 Verificando se é admin...');
    console.log('👤 Usuário atual:', req.user?.email, 'is_admin:', req.user?.is_admin);
    
    if (!req.user?.is_admin) {
      console.log('❌ Acesso negado - não é admin');
      return res.status(403).json({ error: 'Acesso restrito a administradores' });
    }
    
    console.log('✅ Usuário é admin, permitindo acesso');
    next();
  };

  const gestorMiddleware = (req, res, next) => {
    console.log('🔐 Verificando se é gestor...');
    console.log('👤 Usuário atual:', req.user?.email, 'is_gestor:', req.user?.is_gestor);
    
    if (!req.user?.is_gestor && !req.user?.is_admin) {
      console.log('❌ Acesso negado - não é gestor nem admin');
      return res.status(403).json({ error: 'Acesso restrito a gestores' });
    }
    
    console.log('✅ Usuário é gestor ou admin, permitindo acesso');
    next();
  };

  module.exports = { authMiddleware, adminMiddleware, gestorMiddleware };