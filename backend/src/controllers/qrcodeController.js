const { pool } = require('../config/database');
const { gerarQRCode } = require('../utils/helpers');
const { getRequestHost } = require('../utils/requestHost');
const crypto = require('crypto');

// ==================== 1. QR CODE PARA TERMINAL COLETIVO ====================
const gerarQRCodePublico = async (req, res) => {
  try {
    const { local_trabalho_id } = req.body;
    
    console.log('=== GERANDO QR CODE PÚBLICO (TERMINAL) ===');

    if (!local_trabalho_id) {
      return res.status(400).json({ 
        success: false,
        message: 'ID do local de trabalho é obrigatório' 
      });
    }

    // Verificar local
    const localResult = await pool.query(
      'SELECT id, nome_local FROM local_trabalho WHERE id = ? AND ativo = 1',
      [local_trabalho_id]
    );

    if (localResult.rows.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Local de trabalho não encontrado' 
      });
    }

    // Gerar token único
    const session_token = crypto.randomBytes(16).toString('hex');
    const expires_at_ms = Date.now() + (5 * 60 * 1000); // 5 minutos
    
    console.log('📱 QR Code público gerado para:', localResult.rows[0].nome_local);
    console.log('🔑 Token gerado (32 chars):', session_token);

    // Inserir no banco como NÃO utilizado (used = 0)
    await pool.query(
      `INSERT INTO qrcode_session 
       (session_token, local_trabalho_id, expires_at, used) 
       VALUES (?, ?, ?, 0)`,
      [session_token, local_trabalho_id, expires_at_ms]
    );

    // URL para a página de confirmação

    const frontendBaseUrl = process.env.FRONTEND_BASE_URL;

    if (!frontendBaseUrl) {
      console.error('❌ FRONTEND_BASE_URL não definido no .env');
      return res.status(500).json({
        success: false,
        message: 'Erro de configuração: FRONTEND_BASE_URL não definido'
      });
    }

    //const baseUrl = getRequestHost(req); //está retornando um ip do docker
    const confirmUrl = `${frontendBaseUrl}/confirmar?token=${session_token}`;
    
    //DEBUG PARA AJUDAR NO DOCKER(deletar depois)
    console.log('[BASE URL]', getRequestHost(req));

    //provisório
    console.log('🔗 URL gerada:', confirmUrl);

    // Gerar QR Code com a URL (não com JSON)
    const qrCodeImage = await gerarQRCode(confirmUrl);

    res.json({
      success: true,
      message: 'QR Code para ponto gerado com sucesso',
      data: {
        qr_code: qrCodeImage,
        session_token: session_token,
        confirm_url: confirmUrl,
        local: localResult.rows[0].nome_local,
        expires_at: new Date(expires_at_ms).toLocaleString('pt-BR'),
        valid_for: '5 minutos',
        qr_content: confirmUrl,  // Para debug
        token_length: session_token.length // Para debug
      }
    });

  } catch (error) {
    console.error('❌ Erro ao gerar QR Code público:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== 2. QR CODE ADMIN (ORIGINAL) ====================
const gerarQRCodeSession = async (req, res) => {
  try {
    const { local_trabalho_id } = req.body;

    console.log('=== GERANDO QR CODE (ADMIN) ===');

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
    const session_token = crypto.randomBytes(16).toString('hex');
    const expires_at_ms = Date.now() + (2 * 60 * 1000); // 2 minutos
    
    console.log('📱 QR Code admin gerado para:', localResult.rows[0].nome_local);
    console.log('🔑 Token (32 chars):', session_token);
    
    // Inserir no banco (used = 0)
    await pool.query(
      `INSERT INTO qrcode_session (session_token, local_trabalho_id, expires_at, used) 
       VALUES (?, ?, ?, 0)`,
      [session_token, local_trabalho_id, expires_at_ms]
    );

    // Dados para QR Code (JSON para app direto)
    const qrCodeData = {
      session_token: session_token,
      local_id: local_trabalho_id,
      local_nome: localResult.rows[0].nome_local,
      expires_at: new Date(expires_at_ms).toISOString(),
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
        valid_for: '2 minutos',
        token_length: session_token.length
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

// ==================== 3. VALIDAÇÃO DE QR CODE (SOMENTE VERIFICAÇÃO) ====================
const validarQRCode = async (req, res) => {
  try {
    const { session_token } = req.body;
    
    console.log('=== VALIDAÇÃO DE QR CODE (VERIFICAÇÃO APENAS) ===');

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
        success: true,
        valid: false,
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
        local: qrSession.local_nome,
        usado_em: 'Anteriormente'
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

    // QR Code VÁLIDO mas NÃO marca como usado
    // (O registro será feito em outro endpoint)
    console.log('✅ QR Code válido (pronto para uso)');

    res.json({
      success: true,
      valid: true,
      message: 'QR Code válido e pronto para registro',
      data: {
        local_id: qrSession.local_trabalho_id,
        local_nome: qrSession.local_nome,
        expires_in: `${segundosRestantes} segundos`,
        expires_at: new Date(expiraEm).toLocaleString('pt-BR'),
        can_register: true
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

// ==================== 4. OBTER INFORMAÇÕES DO QR CODE (PARA PÁGINA WEB) ====================
const getQRCodeInfo = async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ 
        success: false,
        message: 'Token não fornecido' 
      });
    }

    const result = await pool.query(
      `SELECT 
        qs.session_token,
        qs.expires_at,
        qs.used,
        lt.nome_local,
        lt.endereco,
        CASE 
          WHEN qs.used = 1 THEN 'USADO'
          WHEN qs.expires_at > ? THEN 'VÁLIDO'
          ELSE 'EXPIRADO'
        END as status
       FROM qrcode_session qs
       JOIN local_trabalho lt ON qs.local_trabalho_id = lt.id
       WHERE qs.session_token = ?`,
      [Date.now(), token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'QR Code não encontrado' 
      });
    }

    const info = result.rows[0];
    const expiraEm = parseInt(info.expires_at);
    const segundosRestantes = Math.round((expiraEm - Date.now()) / 1000);

    res.json({
      success: true,
      data: {
        session_token: info.session_token,
        local_nome: info.nome_local,
        local_endereco: info.endereco,
        status: info.status,
        used: info.used === 1,
        expires_at: new Date(expiraEm).toLocaleString('pt-BR'),
        expires_in: segundosRestantes > 0 ? `${segundosRestantes} segundos` : 'Expirado',
        valid: info.status === 'VÁLIDO'
      }
    });

  } catch (error) {
    console.error('❌ Erro ao obter info QR Code:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno'
    });
  }
};

// ==================== 5. LIMPEZA DE TOKENS ANTIGOS ====================
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

// ==================== 6. DEBUG TOKEN ====================
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

// ==================== 7. VERIFICAR SE QR CODE PODE SER USADO ====================
const verificarDisponibilidadeQRCode = async (req, res) => {
  try {
    const { session_token } = req.body;
    
    if (!session_token) {
      return res.status(400).json({ 
        success: false,
        available: false,
        message: 'Token não fornecido' 
      });
    }

    const result = await pool.query(
      `SELECT 
        session_token,
        used,
        expires_at,
        (SELECT nome_local FROM local_trabalho WHERE id = local_trabalho_id) as local_nome
       FROM qrcode_session 
       WHERE session_token = ?`,
      [session_token]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        available: false,
        message: 'QR Code não encontrado'
      });
    }

    const qr = result.rows[0];
    
    if (qr.used === 1) {
      return res.json({
        success: true,
        available: false,
        message: 'QR Code já utilizado'
      });
    }

    const agora = Date.now();
    const expiraEm = parseInt(qr.expires_at);
    
    if (agora > expiraEm) {
      return res.json({
        success: true,
        available: false,
        message: 'QR Code expirado'
      });
    }

    // Tudo OK
    res.json({
      success: true,
      available: true,
      message: 'QR Code disponível para uso',
      data: {
        local_nome: qr.local_nome,
        expires_at: new Date(expiraEm).toLocaleString('pt-BR')
      }
    });

  } catch (error) {
    console.error('❌ Erro na verificação:', error);
    res.status(500).json({ 
      success: false,
      available: false,
      message: 'Erro na verificação'
    });
  }
};

module.exports = { 
  // Para terminal coletivo (público)
  gerarQRCodePublico,
  
  // Para admin/app (protegido)
  gerarQRCodeSession, 
  validarQRCode,
  
  // Para página web
  getQRCodeInfo,
  verificarDisponibilidadeQRCode,
  
  // Utilitários
  limparTokensAntigos,
  debugToken 
};