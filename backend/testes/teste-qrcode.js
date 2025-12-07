// testes/teste-qrcode-simplificado.js
const axios = require('axios');
const API_URL = 'http://localhost:3000/api';

async function testarQRCodeSimplificado() {
  console.log('🧪 === TESTE SIMPLIFICADO DE QR CODE ===\\n');
  
  let token;
  
  try {
    // 1. Login
    console.log('1. 🔐 Login...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@email.com',
      senha: 'admin123'
    });
    
    token = loginRes.data.token;
    console.log('✅ Logado como:', loginRes.data.user.email);
    
    // 2. Listar ou criar local
    console.log('\\n2. 🏢 Verificando locais...');
    let locaisRes;
    try {
      locaisRes = await axios.get(`${API_URL}/locais`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.log('❌ Erro ao listar locais:', error.response?.data || error.message);
      return;
    }
    
    let localId;
    if (locaisRes.data.locais && locaisRes.data.locais.length > 0) {
      localId = locaisRes.data.locais[0].id;
      console.log('✅ Local encontrado:', locaisRes.data.locais[0].nome_local);
    } else {
      console.log('⚠️  Criando local de teste...');
      const criarRes = await axios.post(`${API_URL}/locais`, {
        nome_local: 'Local Teste QR Code',
        latitude: -23.550520,
        longitude: -46.633308,
        raio_tolerancia_metros: 100
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      localId = criarRes.data.local.id;
      console.log('✅ Local criado:', criarRes.data.local.nome_local);
    }
    
    // 3. Gerar QR Code
    console.log('\\n3. 📱 Gerando QR Code...');
    const qrcodeRes = await axios.post(`${API_URL}/qrcode/gerar`, {
      local_trabalho_id: localId,
      duracao_minutos: 5
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const sessionToken = qrcodeRes.data.session_token;
    console.log('✅ QR Code gerado!');
    console.log('   Token:', sessionToken.substring(0, 20) + '...');
    
    // 4. Validar QR Code
    console.log('\\n4. ✅ Validando QR Code...');
    const validarRes = await axios.post(`${API_URL}/qrcode/validar`, {
      session_token: sessionToken,
      latitude: -23.550520,
      longitude: -46.633308,
      tipo_registro: 'ENTRADA'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ QR Code validado!');
    console.log('   Registro ID:', validarRes.data.registro_ponto?.id);
    
    // 5. Verificar listagem
    console.log('\\n5. 📊 Verificando registros...');
    const registrosRes = await axios.get(`${API_URL}/ponto/meus-registros`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ ${registrosRes.data.registros?.length || 0} registro(s) encontrado(s)`);
    
    console.log('\\n🎉 Teste QR Code concluído com sucesso!');
    
  } catch (error) {
    console.error('\\n❌ Erro no teste:', error.response?.data || error.message);
  }
}

testarQRCodeSimplificado();