const { pool } = require('../config/database');
const { validarLocalizacao } = require('../utils/helpers');

const marcarPonto = async (req, res) => {
  const client = await pool.get().connect();
  
  try {
    await client.query('BEGIN');
    
    const { session_token, latitude, longitude, tipo_registro } = req.body;
    const funcionario_id = req.user.id;

    console.log('=== MARCANDO PONTO ===');

    const sessionResult = await client.query(
      `SELECT qs.*, lt.latitude, lt.longitude, lt.raio_tolerancia_metros, lt.nome_local 
       FROM qrcode_session qs 
       JOIN local_trabalho lt ON qs.local_trabalho_id = lt.id 
       WHERE qs.session_token = ? 
         AND qs.used = 0 
         AND qs.expires_at > (strftime('%s', 'now') * 1000)`,
      [session_token]
    );

    if (sessionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false,
        error: 'QR Code inválido, expirado ou já utilizado'
      });
    }

    const session = sessionResult.rows[0];

    if (session.latitude && session.longitude && latitude && longitude) {
      const raio = session.raio_tolerancia_metros || 100;
      const localizacaoValida = validarLocalizacao(
        latitude, longitude,
        session.latitude, session.longitude,
        raio
      );

      if (!localizacaoValida) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          success: false,
          error: `Fora do raio permitido (${raio}m)`
        });
      }
    }

    await client.query(
      'UPDATE qrcode_session SET used = 1 WHERE session_token = ?',
      [session_token]
    );

    const registroResult = await client.query(
      `INSERT INTO registro_ponto 
       (funcionario_id, tipo_registro, latitude_marcada, longitude_marcada, 
        local_validado_id, qrcode_session_id) 
       VALUES (?, ?, ?, ?, ?, ?) 
       RETURNING id, timestamp_registro, tipo_registro`,
      [funcionario_id, 
       tipo_registro || 'entrada', 
       latitude || null, 
       longitude || null, 
       session.local_trabalho_id, 
       session.id]
    );

    await client.query('COMMIT');
    
    const registro = registroResult.rows[0];

    res.json({
      success: true,
      message: getMensagemTipo(tipo_registro),
      registro: registro,
      local: session.nome_local,
      data_hora: registro.timestamp_registro
    });

  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (e) {}
    
    console.error('❌ Erro ao marcar ponto:', error.message);
    
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor'
    });
  } finally {
    client.release();
  }
};

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
    console.error('Erro ao buscar pontos:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor' 
    });
  }
};

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
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor' 
    });
  }
};

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
      JOIN local_trabalho lt ON rp.local_validado_id = lt.id
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
    console.error('Erro:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { 
  marcarPonto, 
  getPontosHoje, 
  getHistorico,
  getTodosRegistros 
};