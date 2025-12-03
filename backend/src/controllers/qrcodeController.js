const { pool } = require('../config/database');
const { gerarQRCode } = require('../utils/helpers');
const crypto = require('crypto');

const gerarQRCodeSession = async (req, res) => {
  try {
    const { local_trabalho_id } = req.body;

    console.log('=== GERANDO QR CODE ===');

    if (!local_trabalho_id) {
      return res.status(400).json({ 
        success: false,
        message: 'ID do local de trabalho é obrigatório' 
      });
    }

    const localResult = await pool.query(
      'SELECT id, nome_local FROM local_trabalho WHERE id = ? AND ativo = 1',
      [local_trabalho_id]
    );

    if (localResult.rows.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Local de trabalho não encontrado ou inativo' 
      });
    }

    // Gerar token
    const session_token = crypto.randomBytes(32).toString('hex');
    const expires_at_ms = Date.now() + (10 * 60 * 1000); // 10 minutos
    
    console.log('📱 QR Code gerado para local:', localResult.rows[0].nome_local);

    // Inserir no banco
    await pool.query(
      `INSERT INTO qrcode_session (session_token, local_trabalho_id, expires_at) 
       VALUES (?, ?, ?)`,
      [session_token, local_trabalho_id, expires_at_ms]
    );

    // Dados para QR Code
    const qrCodeData = {
      session_token: session_token,
      local_id: local_trabalho_id,
      local_nome: localResult.rows[0].nome_local,
      expires_at: new Date(expires_at_ms).toISOString(),
      expires_in: '10 minutos',
      generated_at: new Date().toISOString()
    };

    const qrCodeImage = await gerarQRCode(JSON.stringify(qrCodeData));

    res.json({
      success: true,
      message: 'QR Code gerado com sucesso',
      data: {
        qr_code: qrCodeImage,
        session_token: session_token,
        qr_data: qrCodeData,
        local: localResult.rows[0].nome_local,
        expires_at: new Date(expires_at_ms).toLocaleString('pt-BR'),
        valid_for: '10 minutos'
      }
    });

  } catch (error) {
    console.error('❌ Erro ao gerar QR Code:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno ao gerar QR Code',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const validarQRCode = async (req, res) => {
  try {
    const { session_token } = req.body;
    
    console.log('=== VALIDAÇÃO DE QR CODE ===');

    if (!session_token) {
      return res.status(400).json({ 
        success: false,
        valid: false,
        message: 'Token de sessão não fornecido' 
      });
    }

    // Buscar token
    const tokenCheck = await pool.query(
      `SELECT session_token, expires_at, used, local_trabalho_id,
              (SELECT nome_local FROM local_trabalho WHERE id = local_trabalho_id) as local_nome
       FROM qrcode_session 
       WHERE session_token = ?`,
      [session_token]
    );

    if (tokenCheck.rows.length === 0) {
      return res.json({
        success: true,  // A requisição foi processada com sucesso
        valid: false,   // Mas o QR Code não é válido
        message: 'QR Code não encontrado'
      });
    }

    const qrSession = tokenCheck.rows[0];
    
    // Verificar se já foi usado
    if (qrSession.used === 1) {
      return res.json({
        success: true,
        valid: false,
        message: 'QR Code já foi utilizado',
        local: qrSession.local_nome
      });
    }

    // Verificar expiração
    const agora = Date.now();
    const expiraEm = parseInt(qrSession.expires_at);
    const segundosRestantes = Math.round((expiraEm - agora) / 1000);
    
    console.log(`⏰ Validação: ${segundosRestantes > 0 ? 'VÁLIDO' : 'EXPIRADO'}`);

    if (agora > expiraEm) {
      return res.json({
        success: true,
        valid: false,
        message: 'QR Code expirado',
        expired_at: new Date(expiraEm).toLocaleString('pt-BR'),
        local: qrSession.local_nome
      });
    }

    // QR Code VÁLIDO! Marcar como usado
    await pool.query(
      'UPDATE qrcode_session SET used = 1 WHERE session_token = ?',
      [session_token]
    );

    console.log('✅ QR Code validado com sucesso!');

    res.json({
      success: true,
      valid: true,
      message: 'QR Code válido! Ponto registrado com sucesso.',
      data: {
        local_id: qrSession.local_trabalho_id,
        local_nome: qrSession.local_nome,
        expires_in: `${segundosRestantes} segundos`,
        expires_at: new Date(expiraEm).toLocaleString('pt-BR'),
        registro_time: new Date().toLocaleString('pt-BR')
      }
    });

  } catch (error) {
    console.error('❌ Erro na validação:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno na validação',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const limparTokensAntigos = async (req, res) => {
  try {
    const agora = Date.now();
    const umaHoraAtras = agora - (3600 * 1000);
    
    const result = await pool.query(
      `DELETE FROM qrcode_session 
       WHERE expires_at < ?`,
      [umaHoraAtras]
    );
    
    console.log(`🗑️  Tokens antigos removidos: ${result.rowCount}`);
    
    res.json({
      success: true,
      message: `Limpeza concluída: ${result.rowCount} tokens removidos`,
      deleted_count: result.rowCount
    });
    
  } catch (error) {
    console.error('Erro na limpeza:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao limpar tokens',
      error: error.message 
    });
  }
};

const debugToken = async (req, res) => {
  try {
    const { session_token } = req.query;
    
    if (!session_token) {
      return res.status(400).json({ 
        success: false,
        message: 'Token de sessão não fornecido' 
      });
    }
    
    const result = await pool.query(
      `SELECT 
        session_token,
        used,
        expires_at,
        datetime(expires_at / 1000, 'unixepoch') as expira_em,
        datetime('now') as agora,
        local_trabalho_id,
        (SELECT nome_local FROM local_trabalho WHERE id = local_trabalho_id) as local_nome,
        CASE 
          WHEN used = 1 THEN 'USADO'
          WHEN expires_at > (strftime('%s', 'now') * 1000) THEN 'VÁLIDO'
          ELSE 'EXPIRADO'
        END as status
       FROM qrcode_session 
       WHERE session_token = ?`,
      [session_token]
    );
    
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        found: false,
        message: 'Token não encontrado no banco'
      });
    }
    
    const tokenInfo = result.rows[0];
    const agora = Date.now();
    const expiraEm = parseInt(tokenInfo.expires_at);
    const segundosRestantes = Math.round((expiraEm - agora) / 1000);
    
    res.json({
      success: true,
      found: true,
      message: 'Informações do token',
      data: {
        token: tokenInfo.session_token.substring(0, 20) + '...',
        status: tokenInfo.status,
        used: tokenInfo.used === 1,
        local_id: tokenInfo.local_trabalho_id,
        local_nome: tokenInfo.local_nome,
        expires_at: new Date(expiraEm).toLocaleString('pt-BR'),
        expires_in: segundosRestantes > 0 ? `${segundosRestantes} segundos` : 'Expirado',
        database_time: tokenInfo.agora,
        current_time: new Date().toLocaleString('pt-BR')
      }
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Erro ao debugar token',
      error: error.message 
    });
  }
};

module.exports = { 
  gerarQRCodeSession, 
  validarQRCode, 
  limparTokensAntigos,
  debugToken 
};