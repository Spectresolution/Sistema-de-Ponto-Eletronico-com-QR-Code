const { pool } = require('../config/database');
const { validarLocalizacao, comparePassword } = require('../utils/helpers');
const crypto = require('crypto');

// ==================== 1. MARCAR PONTO (via app com JWT) ====================
const marcarPonto = async (req, res) => {
  try {
    const { session_token, latitude, longitude, tipo_registro } = req.body;
    const funcionario_id = req.user.id;

    console.log('=== MARCANDO PONTO (APP) ===');
    console.log('👤 Funcionário:', funcionario_id);
    console.log('🎫 Token:', session_token?.substring(0, 20) + '...');

    if (!session_token) {
      return res.status(400).json({ 
        success: false,
        error: 'Token de sessão é obrigatório' 
      });
    }

    // 1. Validar QR Code session
    const sessionResult = await pool.query(
      `SELECT qs.*, lt.latitude, lt.longitude, lt.raio_tolerancia_metros, lt.nome_local 
       FROM qrcode_session qs 
       JOIN local_trabalho lt ON qs.local_trabalho_id = lt.id 
       WHERE qs.session_token = ? 
         AND qs.used = 0`,
      [session_token]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'QR Code inválido ou já utilizado'
      });
    }

    const session = sessionResult.rows[0];
    
    // 2. Verificar expiração
    const agora = Date.now();
    const expiraEm = parseInt(session.expires_at);
    
    console.log(`⏰ Expira em: ${new Date(expiraEm).toLocaleString()}`);
    console.log(`⏰ Agora: ${new Date(agora).toLocaleString()}`);
    
    if (agora > expiraEm) {
      return res.status(400).json({ 
        success: false,
        error: 'QR Code expirado'
      });
    }

    // 3. Validar localização (se fornecida)
    if (session.latitude && session.longitude && latitude && longitude) {
      const raio = session.raio_tolerancia_metros || 100;
      const localizacaoValida = validarLocalizacao(
        latitude, longitude,
        session.latitude, session.longitude,
        raio
      );

      if (!localizacaoValida) {
        return res.status(400).json({ 
          success: false,
          error: `Fora do raio permitido (${raio}m)`
        });
      }
    }

    // 4. Atualizar session como usada
    await pool.query(
      'UPDATE qrcode_session SET used = 1 WHERE session_token = ?',
      [session_token]
    );

    // 5. Criar registro de ponto
    const registroResult = await pool.query(
      `INSERT INTO registro_ponto 
       (funcionario_id, tipo_registro, latitude_marcada, longitude_marcada, 
        local_validado_id, qrcode_session_id) 
       VALUES (?, ?, ?, ?, ?, ?) 
       RETURNING id, timestamp_registro, tipo_registro`,
      [
        funcionario_id, 
        tipo_registro || 'entrada', 
        latitude || null, 
        longitude || null, 
        session.local_trabalho_id, 
        session.id
      ]
    );

    const registro = registroResult.rows[0];

    console.log('✅ Ponto registrado! ID:', registro.id);

    res.json({
      success: true,
      message: getMensagemTipo(tipo_registro),
      registro: registro,
      local: session.nome_local,
      data_hora: registro.timestamp_registro
    });

  } catch (error) {
    console.error('❌ Erro ao marcar ponto:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== 2. LOGIN WEB (para página de confirmação) ====================
const loginWeb = async (req, res) => {
  try {
    const { email, senha, device_hash } = req.body;

    console.log('=== LOGIN WEB PARA PONTO ===');

    if (!email || !senha) {
      return res.status(400).json({ 
        success: false,
        error: 'Email e senha são obrigatórios' 
      });
    }

    // Buscar funcionário
    const result = await pool.query(
      `SELECT id, nome, email, senha_hash, ativo 
       FROM funcionario WHERE email = ?`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false,
        error: 'Credenciais inválidas' 
      });
    }

    const user = result.rows[0];

    // Verificar senha
    const senhaValida = await comparePassword(senha, user.senha_hash);
    if (!senhaValida) {
      return res.status(401).json({ 
        success: false,
        error: 'Credenciais inválidas' 
      });
    }

    if (!user.ativo) {
      return res.status(401).json({ 
        success: false,
        error: 'Usuário inativo' 
      });
    }

    // Gerar token de sessão web
    const session_token = crypto.randomBytes(32).toString('hex');
    const expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias

    await pool.query(
      `INSERT INTO sessao_web (funcionario_id, session_token, expires_at, device_hash) 
       VALUES (?, ?, ?, ?)`,
      [user.id, session_token, expires_at.toISOString(), device_hash || null]
    );

    // Registrar dispositivo se fornecido
    if (device_hash) {
      await pool.query(
        `INSERT OR REPLACE INTO dispositivo_autorizacao 
         (funcionario_id, device_hash, ultimo_acesso) 
         VALUES (?, ?, datetime('now'))`,
        [user.id, device_hash]
      );
    }

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      web_token: session_token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email
      },
      expires_at: expires_at.toISOString()
    });

  } catch (error) {
    console.error('❌ Erro no login web:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// ==================== 3. REGISTRAR PONTO VIA WEB ====================
const registrarPontoWeb = async (req, res) => {
  try {
    const { session_token, web_token } = req.body;
    
    console.log('=== REGISTRO DE PONTO VIA WEB ===');

    if (!session_token || !web_token) {
      return res.status(400).json({ 
        success: false,
        error: 'Tokens de sessão e web são obrigatórios' 
      });
    }

    // 1. Validar web_token (sessão do navegador)
    const sessaoResult = await pool.query(
      `SELECT sw.*, f.id as funcionario_id, f.nome 
       FROM sessao_web sw
       JOIN funcionario f ON sw.funcionario_id = f.id
       WHERE sw.session_token = ? AND datetime(sw.expires_at) > datetime('now')`,
      [web_token]
    );

    if (sessaoResult.rows.length === 0) {
      return res.status(401).json({ 
        success: false,
        error: 'Sessão expirada. Faça login novamente.' 
      });
    }

    const funcionario_id = sessaoResult.rows[0].funcionario_id;
    const funcionario_nome = sessaoResult.rows[0].nome;
    
    // 2. Validar QR Code
    const sessionResult = await pool.query(
      `SELECT qs.*, lt.latitude, lt.longitude, lt.raio_tolerancia_metros, lt.nome_local 
       FROM qrcode_session qs 
       JOIN local_trabalho lt ON qs.local_trabalho_id = lt.id 
       WHERE qs.session_token = ? AND qs.used = 0`,
      [session_token]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'QR Code inválido ou já utilizado'
      });
    }

    const session = sessionResult.rows[0];
    
    // Verificar expiração
    const agora = Date.now();
    const expiraEm = parseInt(session.expires_at);
    
    if (agora > expiraEm) {
      return res.status(400).json({ 
        success: false,
        error: 'QR Code expirado'
      });
    }

    // 3. Determinar tipo automático (entrada/saída)
    const ultimoPonto = await pool.query(
      `SELECT tipo_registro 
       FROM registro_ponto 
       WHERE funcionario_id = ? 
       ORDER BY timestamp_registro DESC 
       LIMIT 1`,
      [funcionario_id]
    );

    let tipo_registro = 'entrada';
    if (ultimoPonto.rows.length > 0) {
      const ultimo = ultimoPonto.rows[0].tipo_registro;
      // Se o último foi 'entrada', o próximo deve ser 'saída' e vice-versa
      tipo_registro = (ultimo === 'entrada' || ultimo === 'intervalo') ? 'saída' : 'entrada';
    }

    // 4. Marcar QR Code como usado
    await pool.query(
      'UPDATE qrcode_session SET used = 1 WHERE session_token = ?',
      [session_token]
    );

    // 5. Criar registro
    const registroResult = await pool.query(
      `INSERT INTO registro_ponto 
       (funcionario_id, tipo_registro, local_validado_id, qrcode_session_id) 
       VALUES (?, ?, ?, ?) 
       RETURNING id, timestamp_registro, tipo_registro`,
      [funcionario_id, tipo_registro, session.local_trabalho_id, session.id]
    );

    const registro = registroResult.rows[0];

    console.log(`✅ Ponto registrado via web: ${tipo_registro}`);

    res.json({
      success: true,
      message: `Ponto registrado com sucesso: ${tipo_registro}`,
      comprovante: {
        id: registro.id,
        funcionario: funcionario_nome,
        tipo: registro.tipo_registro,
        data_hora: registro.timestamp_registro,
        local: session.nome_local
      }
    });

  } catch (error) {
    console.error('❌ Erro no registro web:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// ==================== 4. VERIFICAR SESSÃO WEB ====================
const verificarSessaoWeb = async (req, res) => {
  try {
    const { web_token } = req.body;

    if (!web_token) {
      return res.status(400).json({ 
        success: false,
        valid: false,
        error: 'Token web não fornecido' 
      });
    }

    const result = await pool.query(
      `SELECT sw.*, f.nome 
       FROM sessao_web sw
       JOIN funcionario f ON sw.funcionario_id = f.id
       WHERE sw.session_token = ? AND datetime(sw.expires_at) > datetime('now')`,
      [web_token]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        valid: false,
        message: 'Sessão expirada'
      });
    }

    res.json({
      success: true,
      valid: true,
      message: 'Sessão válida',
      user: {
        nome: result.rows[0].nome
      }
    });

  } catch (error) {
    console.error('❌ Erro na verificação de sessão:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno'
    });
  }
};

// ==================== 5. PONTOS DO DIA ====================
const getPontosHoje = async (req, res) => {
  try {
    const funcionario_id = req.user.id;

    const result = await pool.query(
      `SELECT id, timestamp_registro, tipo_registro, observacoes
       FROM registro_ponto 
       WHERE funcionario_id = ? AND DATE(timestamp_registro) = date('now')
       ORDER BY timestamp_registro ASC`,
      [funcionario_id]
    );

    res.json({ 
      success: true,
      registros: result.rows,
      total: result.rows.length 
    });
  } catch (error) {
    console.error('❌ Erro ao buscar pontos:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor' 
    });
  }
};

// ==================== 6. HISTÓRICO ====================
const getHistorico = async (req, res) => {
  try {
    const funcionario_id = req.user.id;
    const { mes, ano } = req.query;
    
    const dataAtual = new Date();
    const targetMonth = mes || dataAtual.getMonth() + 1;
    const targetYear = ano || dataAtual.getFullYear();

    const result = await pool.query(
      `SELECT 
         id,
         timestamp_registro,
         tipo_registro,
         observacoes,
         strftime('%Y-%m-%d', timestamp_registro) as data
       FROM registro_ponto 
       WHERE funcionario_id = ? 
         AND strftime('%m', timestamp_registro) = ? 
         AND strftime('%Y', timestamp_registro) = ? 
       ORDER BY timestamp_registro ASC`,
      [funcionario_id, 
       targetMonth.toString().padStart(2, '0'), 
       targetYear.toString()]
    );

    const registrosPorData = {};
    result.rows.forEach(registro => {
      const data = registro.data;
      if (!registrosPorData[data]) {
        registrosPorData[data] = [];
      }
      registrosPorData[data].push(registro);
    });

    res.json({ 
      success: true,
      historico: registrosPorData,
      mes: targetMonth,
      ano: targetYear
    });
  } catch (error) {
    console.error('❌ Erro ao buscar histórico:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor' 
    });
  }
};

// ==================== 7. TODOS REGISTROS (admin) ====================
const getTodosRegistros = async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return res.status(403).json({ 
        success: false, 
        error: 'Acesso negado' 
      });
    }

    const { data, funcionario_id } = req.query;

    let query = `
      SELECT rp.*, u.nome as funcionario_nome, lt.nome_local
      FROM registro_ponto rp
      JOIN funcionario u ON rp.funcionario_id = u.id
      LEFT JOIN local_trabalho lt ON rp.local_validado_id = lt.id
      WHERE 1=1
    `;
    
    let params = [];

    if (data) {
      query += ` AND DATE(rp.timestamp_registro) = ?`;
      params.push(data);
    }

    if (funcionario_id) {
      query += ` AND rp.funcionario_id = ?`;
      params.push(funcionario_id);
    }

    query += ` ORDER BY rp.timestamp_registro DESC LIMIT 100`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      registros: result.rows
    });

  } catch (error) {
    console.error('❌ Erro em getTodosRegistros:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
};

// ==================== FUNÇÕES AUXILIARES ====================
const getMensagemTipo = (tipo) => {
  const mensagens = {
    'entrada': 'Entrada registrada com sucesso',
    'saída': 'Saída registrada com sucesso',
    'saida': 'Saída registrada com sucesso',
    'intervalo': 'Início de intervalo',
    'retorno': 'Retorno do intervalo'
  };
  return mensagens[tipo] || 'Ponto registrado';
};

// ==================== EXPORT ====================
module.exports = { 
  // Fluxo app (com JWT)
  marcarPonto,
  
  // Fluxo web (sem JWT)
  loginWeb,
  registrarPontoWeb,
  verificarSessaoWeb,
  
  // Consultas
  getPontosHoje,
  getHistorico,
  getTodosRegistros
};