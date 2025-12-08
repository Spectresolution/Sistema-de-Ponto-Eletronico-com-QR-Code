// testes/teste-fluxo-web.js
const axios = require('axios');
const API_URL = 'http://localhost:3000/api';

async function testarFluxoWeb() {
  console.log('🚀 Testando fluxo web...\n');
  
  try {
    // 1. Gerar QR Code público
    console.log('1. Gerando QR Code público...');
    const qrcodeRes = await axios.post(`${API_URL}/qrcode/gerar-publico`, {
      local_trabalho_id: 1
    });
    
    const sessionToken = qrcodeRes.data.data.session_token;
    console.log('✅ QR Code gerado:', sessionToken.substring(0, 20) + '...');
    
    // 2. Login web
    console.log('\n2. Fazendo login web...');
    const loginRes = await axios.post(`${API_URL}/ponto/login-web`, {
      email: 'admin@email.com',
      senha: 'admin123',
      device_hash: 'test-device-123'
    });
    
    const webToken = loginRes.data.web_token;
    console.log('✅ Login OK. Web Token:', webToken.substring(0, 20) + '...');
    
    // 3. Registrar ponto via web
    console.log('\n3. Registrando ponto via web...');
    const pontoRes = await axios.post(`${API_URL}/ponto/registrar-web`, {
      session_token: sessionToken,
      web_token: webToken
    });
    
    console.log('✅ Ponto registrado!');
    console.log('   Comprovante:', pontoRes.data.comprovante);
    
    // 4. Verificar sessão
    console.log('\n4. Verificando sessão...');
    const sessaoRes = await axios.post(`${API_URL}/ponto/verificar-sessao`, {
      web_token: webToken
    });
    
    console.log('✅ Sessão válida:', sessaoRes.data.valid);
    
    console.log('\n🎉 Fluxo web testado com sucesso!');
    
  } catch (error) {
    console.error('\n❌ Erro:', error.response?.data || error.message);
  }
}

testarFluxoWeb();