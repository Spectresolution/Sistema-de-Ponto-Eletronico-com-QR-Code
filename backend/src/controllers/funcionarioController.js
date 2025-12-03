const { pool } = require('../config/database');
const { hashPassword } = require('../utils/helpers');

// Criar funcionário
const criarFuncionario = async (req, res) => {
  try {
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

    console.log('👥 Criando funcionário:', email);
    console.log('📦 Dados recebidos:', { 
      nome, email, senha: senha ? '***' : undefined, cpf, cargo 
    });

    // Validações básicas
    if (!nome || !cpf || !email || !senha || !cargo || !data_contratacao) {
      return res.status(400).json({ 
        success: false,
        error: 'Nome, CPF, email, senha, cargo e data de contratação são obrigatórios' 
      });
    }

    console.log('🔑 Gerando hash para senha...');
    const senhaHash = await hashPassword(senha);
    console.log('✅ Hash gerado:', senhaHash);

    const result = await pool.query(
      `INSERT INTO funcionario 
       (nome, cpf, matricula, email, senha_hash, cargo, departamento, 
        jornada_padrao_horas, data_contratacao, is_admin, is_gestor, gestor_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
       RETURNING id, nome, email, cpf, matricula, cargo, is_admin, is_gestor, data_contratacao`,
      [
        nome, 
        cpf, 
        matricula || null, 
        email, 
        senhaHash, 
        cargo, 
        departamento || null, 
        jornada_padrao_horas || 8.00, 
        data_contratacao, 
        is_admin ? 1 : 0, 
        is_gestor ? 1 : 0, 
        gestor_id || null
      ]
    );

    console.log('✅ Funcionário criado no banco:', email);

    // RESPOSTA COM HASH VISÍVEL
    res.status(201).json({
      success: true,
      message: 'Funcionário criado com sucesso',
      funcionario: result.rows[0],
      debug_info: {
        senha_inserida: senha,
        senha_hash_gerada: senhaHash, // AQUI ESTÁ O HASH!
        hash_tamanho: senhaHash.length,
        note: 'Use esta senha para fazer login'
      },
      login_info: {
        email: email,
        senha: senha,
        endpoint: 'POST /api/auth/login',
        body_example: { email: email, senha: senha }
      }
    });
  } catch (error) {
    console.error('❌ Erro ao criar funcionário:', error);
    
    if (error.message && error.message.includes('UNIQUE')) {
      return res.status(400).json({ 
        success: false,
        error: 'Email ou CPF já cadastrado' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Listar todos os funcionários
const listarFuncionarios = async (req, res) => {
  try {
    const { ativo } = req.query;
    let query = `
      SELECT id, nome, cpf, matricula, email, cargo, departamento, 
             jornada_padrao_horas, data_contratacao, is_admin, is_gestor, 
             ativo, created_at
      FROM funcionario
    `;
    
    const params = [];
    
    if (ativo !== undefined) {
      query += ' WHERE ativo = ?';
      params.push(ativo === 'true' ? 1 : 0);
    }
    
    query += ' ORDER BY nome';
    
    // CORREÇÃO: Use pool.query() direto
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

// Buscar funcionário por ID
const buscarFuncionario = async (req, res) => {
  try {
    const { id } = req.params;
    
    // CORREÇÃO: Use pool.query() direto
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

// Atualizar funcionário
const atualizarFuncionario = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nome, cpf, matricula, email, cargo, departamento, 
      jornada_padrao_horas, data_contratacao, is_admin, 
      is_gestor, gestor_id, ativo 
    } = req.body;
    
    // CORREÇÃO: Use pool.query() direto
    const result = await pool.query(
      `UPDATE funcionario 
       SET nome = COALESCE(?, nome),
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
        nome, cpf, matricula, email, cargo, departamento, 
        jornada_padrao_horas, data_contratacao, is_admin ? 1 : 0, 
        is_gestor ? 1 : 0, gestor_id, ativo ? 1 : 0, id
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
    
    if (error.message && error.message.includes('UNIQUE')) {
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

// Desativar/Ativar funcionário
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
    
    // CORREÇÃO: Use pool.query() direto
    const result = await pool.query(
      `UPDATE funcionario 
       SET ativo = ?, 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?
       RETURNING id, nome, email, ativo`,
      [ativo ? 1 : 0, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Funcionário não encontrado' 
      });
    }
    
    const statusMsg = ativo ? 'ativado' : 'desativado';
    res.json({
      success: true,
      message: `Funcionário ${statusMsg} com sucesso`,
      funcionario: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erro ao alterar status do funcionário:', error);
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