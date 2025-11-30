const { pool } = require('../config/database');
const { gerarQRCode } = require('../utils/helpers');
const crypto = require('crypto');

const gerarQRCodeSession = async (req, res) => {
  try {
    const { local_trabalho_id } = req.body;

    // Verificar se local existe e está ativo
    const localResult = await pool.get().query(
      'SELECT id, nome_local FROM local_trabalho WHERE id = $1 AND ativo = true',
      [local_trabalho_id]
    );

    if (localResult.rows.length === 0) {
      return res.status(400).json({ error: 'Local de trabalho inválido ou inativo' });
    }

    // Gerar token único
    const session_token = crypto.randomBytes(64).toString('hex');
    const expires_at = new Date(Date.now() + 2 * 60 * 1000); // 2 minutos

    // Criar sessão
    const sessionResult = await pool.get().query(
      `INSERT INTO qrcode_session (session_token, local_trabalho_id, expires_at) 
       VALUES ($1, $2, $3) 
       RETURNING id, session_token, expires_at`,
      [session_token, local_trabalho_id, expires_at]
    );

    const session = sessionResult.rows[0];

    // Gerar QR Code
    const qrCodeData = {
      session_token: session.session_token,
      local_id: local_trabalho_id,
      expires_at: session.expires_at.toISOString(),
      generated_at: new Date().toISOString()
    };

    const qrCodeImage = await gerarQRCode(qrCodeData);

    res.json({
      qr_code: qrCodeImage,
      session_token: session.session_token,
      expires_at: session.expires_at,
      local: localResult.rows[0].nome_local
    });

  } catch (error) {
    console.error('Erro ao gerar QR Code:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const validarQRCode = async (req, res) => {
  try {
    const { session_token } = req.body;

    const result = await pool.get().query(
      `SELECT qs.*, lt.nome_local 
       FROM qrcode_session qs 
       JOIN local_trabalho lt ON qs.local_trabalho_id = lt.id 
       WHERE qs.session_token = $1 AND qs.expires_at > NOW() AND NOT qs.used`,
      [session_token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ 
        valid: false, 
        error: 'QR Code inválido, expirado ou já utilizado' 
      });
    }

    res.json({ 
      valid: true, 
      session: result.rows[0],
      message: 'QR Code válido para marcação'
    });

  } catch (error) {
    console.error('Erro ao validar QR Code:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = { gerarQRCodeSession, validarQRCode };