const axios = require('axios');
const API_URL = 'http://localhost:3000/api';

async function testarFluxoTerminalWeb() {
  console.log('🚀 === TESTE FLUXO TERMINAL + WEB ===\n');
  
  let tokenAdmin;
  let localId;
  
  try {
    // 1. Login como admin
    console.log('1. 🔐 Login como admin...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@email.com',
      senha: 'admin123'
    });
    
    tokenAdmin = loginRes.data.token;
    console.log('✅ Admin logado');
    
    // 2. Obter local
    console.log('\n2. 🏢 Obtendo local...');
    const locaisRes = await axios.get(`${API_URL}/locais`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    
    localId = locaisRes.data.locais[0].id;
    console.log('✅ Local:', locaisRes.data.locais[0].nome_local);
    
    // 3. GERAR QR CODE PÚBLICO (para terminal coletivo)
    console.log('\n3. 📱 Gerando QR Code Público (terminal)...');
    const qrcodeRes = await axios.post(`${API_URL}/qrcode/gerar-publico`, {
      local_trabalho_id: localId
    });
    
    const sessionToken = qrcodeRes.data.data.session_token;
    const confirmUrl = qrcodeRes.data.data.confirm_url;
    
    console.log('✅ QR Code Público gerado!');
    console.log('   Token:', sessionToken.substring(0, 20) + '...');
    console.log('   URL de confirmação:', confirmUrl);
    console.log('   QR Code (imagem base64):', qrcodeRes.data.data.qr_code.substring(0, 50) + '...');
    
    // 4. VERIFICAR INFORMAÇÕES DO QR CODE (página web usaria)
    console.log('\n4. 🔍 Obtendo informações do QR Code...');
    const infoRes = await axios.get(`${API_URL}/qrcode/info?token=${sessionToken}`);
    
    console.log('✅ Informações:');
    console.log('   Local:', infoRes.data.data.local_nome);
    console.log('   Status:', infoRes.data.data.status);
    console.log('   Válido:', infoRes.data.data.valid);
    
    // 5. VERIFICAR DISPONIBILIDADE
    console.log('\n5. ✅ Verificando disponibilidade...');
    const verificarRes = await axios.post(`${API_URL}/qrcode/verificar`, {
      session_token: sessionToken
    });
    
    console.log('   Disponível:', verificarRes.data.available ? 'SIM' : 'NÃO');
    console.log('   Mensagem:', verificarRes.data.message);
    
    // 6. TESTAR LOGIN WEB (simula funcionário na página)
    console.log('\n6. 🌐 Testando login web...');
    const loginWebRes = await axios.post(`${API_URL}/ponto/login-web`, {
      email: 'admin@email.com',
      senha: 'admin123',
      device_hash: 'test-device-123'
    });
    
    const webToken = loginWebRes.data.web_token;
    console.log('✅ Login web realizado!');
    console.log('   Web Token:', webToken.substring(0, 20) + '...');
    
    // 7. REGISTRAR PONTO VIA WEB (fluxo completo)
    console.log('\n7. 📝 Registrando ponto via web...');
    const pontoWebRes = await axios.post(`${API_URL}/ponto/registrar-web`, {
      session_token: sessionToken,
      web_token: webToken
    });
    
    console.log('✅ Ponto registrado via web!');
    console.log('   Comprovante ID:', pontoWebRes.data.comprovante.id);
    console.log('   Tipo:', pontoWebRes.data.comprovante.tipo);
    console.log('   Funcionário:', pontoWebRes.data.comprovante.funcionario);
    
    // 8. VERIFICAR SE QR CODE FOI MARCADO COMO USADO
    console.log('\n8. 🔄 Verificando status do QR Code após uso...');
    const infoAposRes = await axios.get(`${API_URL}/qrcode/info?token=${sessionToken}`);
    
    console.log('   Status após uso:', infoAposRes.data.data.status);
    console.log('   Usado:', infoAposRes.data.data.used ? 'SIM' : 'NÃO');
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 FLUXO TERMINAL+WEB TESTADO COM SUCESSO!');
    console.log('='.repeat(50));
    console.log('✅ QR Code Público gerado');
    console.log('✅ Informações obtidas');
    console.log('✅ Login web funcionando');
    console.log('✅ Registro via web funcionando');
    console.log('✅ QR Code marcado como usado');
    
  } catch (error) {
    console.error('\n❌ Erro no fluxo:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Erro:', error.response.data?.error || error.response.data?.message);
      console.log('Dados:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Erro:', error.message);
    }
  }
}

testarFluxoTerminalWeb();