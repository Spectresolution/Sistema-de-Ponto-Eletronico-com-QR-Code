const { pool } = require('../config/database');
const { hashPassword } = require('../utils/helpers');

// Helpers para SQLite boolean
const toBoolInt = (v, defaultValue = 0) => {
  // Se não foi fornecido, retorna o valor padrão (0)
  if (v === undefined) return defaultValue;
  
  // Se for null, também retorna o valor padrão
  if (v === null) return defaultValue;
  
  // Converte para número
  return v ? 1 : 0;
};
//   Criar Funcionário
const criarFuncionario = async (req, res) => {
  try {
    console.log('👤 Criando funcionário por:', req.user?.email);
    
    //  Regras de permissão

    // Apenas admins podem criar admins
    if (req.body.is_admin && !req.user?.is_admin) {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores podem criar outros administradores'
      });
    }

    // Apenas admins podem criar gestores
    if (req.body.is_gestor && !req.user?.is_admin) {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores podem criar gestores'
      });
    }

    // Gestores não podem criar admins nem gestores
    if (req.user?.is_gestor && !req.user?.is_admin) {
      if (req.body.is_admin || req.body.is_gestor) {
        return res.status(403).json({
          success: false,
          error: 'Gestores não podem criar outros gestores ou administradores'
        });
      }
    }
    
    const {
      nome,
      cpf,
      matricula,
      email,
      senha,
      cargo,
      departamento,
      jornada_padrao_horas,
      data_contratacao,
      is_admin,
      is_gestor,
      gestor_id
    } = req.body;

    if (!nome || !cpf || !email || !senha || !cargo || !data_contratacao) {
      return res.status(400).json({
        success: false,
        error: 'Nome, CPF, email, senha, cargo e data de contratação são obrigatórios'
      });
    }
    
    //  Hash da senha
    const senhaHash = await hashPassword(senha);
    
    //  INSERT no banco
    const result = await pool.query(
      `INSERT INTO funcionario (
        nome, cpf, matricula, email, senha_hash, cargo, departamento,
        jornada_padrao_horas, data_contratacao, is_admin, is_gestor, gestor_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id, nome, email, cpf, matricula, cargo, is_admin, is_gestor, data_contratacao`,
      [
        nome,
        cpf,
        matricula || null,
        email,
        senhaHash,
        cargo,
        departamento || null,
        jornada_padrao_horas || 8.0,
        data_contratacao,
        toBoolInt(is_admin),
        toBoolInt(is_gestor),
        gestor_id || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Funcionário criado com sucesso',
      funcionario: result.rows[0],
      nota: "A senha fornecida deve ser usada no login. Ela NÃO será exibida novamente."
    });

  } catch (error) {
    console.error('❌ Erro ao criar funcionário:', error);

    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({
        success: false,
        error: 'Email ou CPF já cadastrado'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

//   Listar Funcionários
const listarFuncionarios = async (req, res) => {
  try {
    const { ativo } = req.query;

    let query = `
      SELECT id, nome, cpf, matricula, email, cargo, departamento,
             jornada_padrao_horas, data_contratacao, is_admin, is_gestor,
             ativo, created_at
      FROM funcionario`;
    const params = [];

    if (ativo !== undefined) {
      query += ` WHERE ativo = ?`;
      params.push(ativo === 'true' ? 1 : 0);
    }

    query += ` ORDER BY nome`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      funcionarios: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('❌ Erro ao listar funcionários:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

//   Buscar por ID
const buscarFuncionario = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, nome, cpf, matricula, email, cargo, departamento,
              jornada_padrao_horas, data_contratacao, is_admin, is_gestor,
              gestor_id, ativo, created_at
       FROM funcionario
       WHERE id = ?`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Funcionário não encontrado'
      });
    }

    res.json({
      success: true,
      funcionario: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erro ao buscar funcionário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

//   Atualizar Funcionário
const atualizarFuncionario = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      nome,
      cpf,
      matricula,
      email,
      cargo,
      departamento,
      jornada_padrao_horas,
      data_contratacao,
      is_admin,
      is_gestor,
      gestor_id,
      ativo
    } = req.body;

    const result = await pool.query(
      `UPDATE funcionario SET
          nome = COALESCE(?, nome),
          cpf = COALESCE(?, cpf),
          matricula = COALESCE(?, matricula),
          email = COALESCE(?, email),
          cargo = COALESCE(?, cargo),
          departamento = COALESCE(?, departamento),
          jornada_padrao_horas = COALESCE(?, jornada_padrao_horas),
          data_contratacao = COALESCE(?, data_contratacao),
          is_admin = COALESCE(?, is_admin),
          is_gestor = COALESCE(?, is_gestor),
          gestor_id = COALESCE(?, gestor_id),
          ativo = COALESCE(?, ativo),
          updated_at = CURRENT_TIMESTAMP
       WHERE id = ?
       RETURNING id, nome, email, cpf, matricula, cargo, is_admin, is_gestor, ativo`,
      [
        nome,
        cpf,
        matricula,
        email,
        cargo,
        departamento,
        jornada_padrao_horas,
        data_contratacao,
        toBoolInt(is_admin),
        toBoolInt(is_gestor),
        gestor_id,
        toBoolInt(ativo),
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Funcionário não encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Funcionário atualizado com sucesso',
      funcionario: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar funcionário:', error);

    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({
        success: false,
        error: 'Email ou CPF já cadastrado'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

//   Ativar / Desativar
const toggleStatusFuncionario = async (req, res) => {
  try {
    const { id } = req.params;
    const { ativo } = req.body;

    if (ativo === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Campo "ativo" é obrigatório'
      });
    }

    const result = await pool.query(
      `UPDATE funcionario
         SET ativo = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?
       RETURNING id, nome, email, ativo`,
      [toBoolInt(ativo), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Funcionário não encontrado'
      });
    }

    res.json({
      success: true,
      message: `Funcionário ${ativo ? 'ativado' : 'desativado'} com sucesso`,
      funcionario: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erro ao alterar status:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  criarFuncionario,
  listarFuncionarios,
  buscarFuncionario,
  atualizarFuncionario,
  toggleStatusFuncionario
};
