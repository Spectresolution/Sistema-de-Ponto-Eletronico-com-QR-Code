// testes/debug-token.js
const axios = require('axios');
const API_URL = 'http://localhost:3000/api';

async function debugToken() {
  console.log('🔍 Debug de Token QR Code\n');
  
  try {
    // Gerar QR Code
    const qrcodeRes = await axios.post(`${API_URL}/qrcode/gerar-publico`, {
      local_trabalho_id: 1
    });
    
    const token = qrcodeRes.data.data.session_token;
    console.log('✅ Token gerado:', token);
    console.log('🔢 Comprimento:', token.length, 'caracteres');
    console.log('🔗 URL completa:', qrcodeRes.data.data.confirm_url);
    
    // Verificar se consegue buscar
    const infoRes = await axios.get(`${API_URL}/qrcode/info?token=${token}`);
    console.log('\n✅ Busca direta no banco:');
    console.log('   Encontrado:', infoRes.data.success ? 'SIM' : 'NÃO');
    console.log('   Status:', infoRes.data.data?.status || 'Não encontrado');
    
    // Testar verificação
    const verificarRes = await axios.post(`${API_URL}/qrcode/verificar`, {
      session_token: token
    });
    
    console.log('\n✅ Verificação:');
    console.log('   Disponível:', verificarRes.data.available ? 'SIM' : 'NÃO');
    console.log('   Mensagem:', verificarRes.data.message);
    
    // Simular URL truncada (problema)
    console.log('\n⚠️  Testando token truncado (simulando leitor):');
    const tokenTruncado = token.substring(0, token.length - 2); // Remove 2 chars
    console.log('   Token truncado:', tokenTruncado);
    console.log('   Comprimento:', tokenTruncado.length, 'caracteres');
    
    try {
      const truncadoRes = await axios.get(`${API_URL}/qrcode/info?token=${tokenTruncado}`);
      console.log('   Encontrado?:', truncadoRes.data.success ? 'SIM' : 'NÃO');
    } catch (error) {
      console.log('   ❌ Não encontrado (como esperado)');
    }
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

debugToken();