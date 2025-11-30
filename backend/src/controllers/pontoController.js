const { pool } = require('../config/database');
const { validarLocalizacao } = require('../utils/helpers');

const marcarPonto = async (req, res) => {
  const client = await pool.get().connect();
  
  try {
    await client.query('BEGIN');
    
    const { session_token, latitude, longitude, tipo_registro, foto_base64, dispositivo_info } = req.body;
    const funcionario_id = req.user.id;

    // Validar sessão QR Code
    const sessionResult = await client.query(
      `SELECT qs.*, lt.latitude, lt.longitude, lt.raio_tolerancia_metros 
       FROM qrcode_session qs 
       JOIN local_trabalho lt ON qs.local_trabalho_id = lt.id 
       WHERE qs.session_token = $1 AND qs.expires_at > NOW() AND NOT qs.used`,
      [session_token]
    );

    if (sessionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'QR Code inválido ou expirado' });
    }

    const session = sessionResult.rows[0];

    // Validar localização
    const localizacaoValida = validarLocalizacao(
      latitude, longitude,
      session.latitude, session.longitude,
      session.raio_tolerancia_metros
    );

    if (!localizacaoValida) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Fora do local autorizado para marcação',
        detalhes: `Você está fora do raio de ${session.raio_tolerancia_metros}m do local autorizado`
      });
    }

    // Marcar QR Code como usado
    await client.query(
      'UPDATE qrcode_session SET used = true WHERE session_token = $1',
      [session_token]
    );

    // Salvar registro de ponto
    const registroResult = await client.query(
      `INSERT INTO registro_ponto 
       (funcionario_id, tipo_registro, latitude_marcada, longitude_marcada, 
        local_validado_id, qrcode_session_id, dispositivo_info) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, timestamp_registro, tipo_registro`,
      [funcionario_id, tipo_registro, latitude, longitude, 
       session.local_trabalho_id, session.id, dispositivo_info]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Ponto registrado com sucesso',
      registro: registroResult.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao marcar ponto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
};

const getPontosHoje = async (req, res) => {
  try {
    const funcionario_id = req.user.id;

    const result = await pool.get().query(
      `SELECT id, timestamp_registro, tipo_registro, observacoes
       FROM registro_ponto 
       WHERE funcionario_id = $1 AND DATE(timestamp_registro) = CURRENT_DATE 
       ORDER BY timestamp_registro ASC`,
      [funcionario_id]
    );

    res.json({ registros: result.rows });
  } catch (error) {
    console.error('Erro ao buscar pontos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const getHistorico = async (req, res) => {
  try {
    const funcionario_id = req.user.id;
    const { mes, ano } = req.query;
    const targetMonth = mes || new Date().getMonth() + 1;
    const targetYear = ano || new Date().getFullYear();

    const result = await pool.get().query(
      `SELECT DATE(timestamp_registro) as data, 
              tipo_registro, 
              timestamp_registro,
              observacoes
       FROM registro_ponto 
       WHERE funcionario_id = $1 
         AND EXTRACT(MONTH FROM timestamp_registro) = $2 
         AND EXTRACT(YEAR FROM timestamp_registro) = $3 
       ORDER BY timestamp_registro ASC`,
      [funcionario_id, targetMonth, targetYear]
    );

    // Agrupar por data
    const registrosPorData = {};
    result.rows.forEach(registro => {
      const data = registro.data.toISOString().split('T')[0];
      if (!registrosPorData[data]) {
        registrosPorData[data] = [];
      }
      registrosPorData[data].push(registro);
    });

    res.json({ historico: registrosPorData });
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = { marcarPonto, getPontosHoje, getHistorico };  