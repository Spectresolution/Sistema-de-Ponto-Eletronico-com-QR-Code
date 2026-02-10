const { pool } = require('../config/database');
const { comparePassword, generateToken } = require('../utils/helpers');

const login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        success: false,
        error: 'Email e senha são obrigatórios'
      });
    }

    const result = await pool.query(
      `SELECT id, nome, email, senha_hash, is_admin, is_gestor, ativo, cargo
       FROM funcionario
       WHERE email = ?`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas'
      });
    }

    const user = result.rows[0];

    if (!user.ativo) {
      return res.status(403).json({
        success: false,
        error: 'Usuário inativo'
      });
    }

    const senhaValida = await comparePassword(senha, user.senha_hash);
    if (!senhaValida) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas'
      });
    }

    // 🔐 Gera token já com admin/gestor embutido
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        cargo: user.cargo,
        is_admin: user.is_admin,
        is_gestor: user.is_gestor
      }
    });

  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

module.exports = { login };
