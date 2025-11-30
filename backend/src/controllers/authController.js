const { pool } = require('../config/database');
const { comparePassword, generateToken, hashPassword } = require('../utils/helpers');

const login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const result = await pool.get().query(
      `SELECT id, nome, email, senha_hash, is_admin, is_gestor, ativo, cargo 
       FROM funcionario WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user = result.rows[0];

    if (!user.ativo) {
      return res.status(401).json({ error: 'Usuário inativo' });
    }

    const senhaValida = await comparePassword(senha, user.senha_hash);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        is_admin: user.is_admin,
        is_gestor: user.is_gestor,
        cargo: user.cargo
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const criarFuncionario = async (req, res) => {
  try {
    const { nome, email, senha, cpf, cargo, departamento, jornada_padrao_horas, data_contratacao, is_admin, is_gestor, gestor_id } = req.body;

    const senhaHash = await hashPassword(senha);

    const result = await pool.get().query(
      `INSERT INTO funcionario 
       (nome, email, senha_hash, cpf, cargo, departamento, jornada_padrao_horas, data_contratacao, is_admin, is_gestor, gestor_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING id, nome, email, cargo, is_admin, is_gestor`,
      [nome, email, senhaHash, cpf, cargo, departamento, jornada_padrao_horas, data_contratacao, is_admin || false, is_gestor || false, gestor_id]
    );

    res.status(201).json({
      message: 'Funcionário criado com sucesso',
      funcionario: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email ou CPF já cadastrado' });
    }
    console.error('Erro ao criar funcionário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = { login, criarFuncionario };