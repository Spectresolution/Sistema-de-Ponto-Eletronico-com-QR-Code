const { pool } = require('../config/database');
const { comparePassword, generateToken } = require('../utils/helpers');

const login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    console.log('🔐 Tentando login para:', email);

    if (!email || !senha) {
      console.log('❌ Faltando email ou senha');
      return res.status(400).json({ 
        success: false,
        error: 'Email e senha são obrigatórios' 
      });
    }

    // Log da query
    const query = `SELECT id, nome, email, senha_hash, is_admin, is_gestor, ativo, cargo 
                   FROM funcionario WHERE email = ?`;
    console.log('📝 Query:', query);
    console.log('🎯 Parâmetros:', [email]);

    const result = await pool.query(query, [email]);

    console.log('📊 Usuários encontrados:', result.rows.length);

    if (result.rows.length === 0) {
      console.log('❌ Nenhum usuário encontrado com email:', email);
      return res.status(401).json({ 
        success: false,
        error: 'Credenciais inválidas' 
      });
    }

    const user = result.rows[0];
    console.log('👤 Usuário encontrado:', {
      id: user.id,
      nome: user.nome,
      email: user.email,
      is_admin: user.is_admin,
      ativo: user.ativo
    });

    if (!user.ativo) {
      console.log('❌ Usuário inativo:', user.email);
      return res.status(401).json({ 
        success: false,
        error: 'Usuário inativo' 
      });
    }

    console.log('🔑 Verificando senha...');
  
    const senhaValida = await comparePassword(senha, user.senha_hash);
    
    if (!senhaValida) {
      console.log('❌ Senha incorreta para:', user.email);
      return res.status(401).json({ 
        success: false,
        error: 'Credenciais inválidas' 
      });
    }

    console.log('🎫 Gerando token...');
    const token = generateToken(user);
   
    console.log('✅ Login bem-sucedido para:', user.email);

    // RESPOSTA Com token completo
    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      token: token, // Token COMPLETO para copiar
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        is_admin: user.is_admin,
        is_gestor: user.is_gestor,
        cargo: user.cargo
      },
      debug_info: {
        query_executed: query,
        user_found: true,
        user_active: user.ativo,
        password_valid: true
      }
    });
  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor',
    });
  }
};

module.exports = { login };