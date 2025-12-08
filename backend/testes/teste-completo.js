// testes/teste-fluxo-real.js
const axios = require('axios');
const API_URL = 'http://localhost:3000/api';

async function testarFluxoReal() {
  console.log('🚀 === TESTE FLUXO REAL COMPLETO ===\n');
  
  let tokenAdmin;
  let localId;
  let sessionToken;
  
  try {
    // 1. Login como admin
    console.log('1. 🔐 Login como admin...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@email.com',
      senha: 'admin123'
    });
    
    tokenAdmin = loginRes.data.token;
    console.log('✅ Admin logado:', loginRes.data.user.email);
    
    // 2. Criar ou buscar local
    console.log('\n2. 🏢 Obtendo local...');
    const locaisRes = await axios.get(`${API_URL}/locais`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    
    if (locaisRes.data.locais && locaisRes.data.locais.length > 0) {
      localId = locaisRes.data.locais[0].id;
      console.log('✅ Local encontrado:', locaisRes.data.locais[0].nome_local);
    } else {
      console.log('➕ Criando novo local...');
      const criarLocalRes = await axios.post(`${API_URL}/locais`, {
        nome_local: 'Escritório Principal',
        endereco: 'Av. Paulista, 1000',
        latitude: -23.561399,
        longitude: -46.655539,
        raio_tolerancia_metros: 100
      }, {
        headers: { Authorization: `Bearer ${tokenAdmin}` }
      });
      
      localId = criarLocalRes.data.local.id;
      console.log('✅ Local criado:', criarLocalRes.data.local.nome_local);
    }
    
    // 3. Gerar QR Code VÁLIDO
    console.log('\n3. 📱 Gerando QR Code válido...');
    const qrcodeRes = await axios.post(`${API_URL}/qrcode/gerar`, {
      local_trabalho_id: localId
    }, {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    
    sessionToken = qrcodeRes.data.data.session_token;
    console.log('✅ QR Code gerado com sucesso!');
    console.log('   Token:', sessionToken.substring(0, 20) + '...');
    console.log('   Expira em:', qrcodeRes.data.data.expires_at);
    
    // 4. Validar QR Code primeiro (endpoint separado)
    console.log('\n4. ✅ Validando QR Code...');
    const validarRes = await axios.post(`${API_URL}/qrcode/validar`, {
      session_token: sessionToken
    }, {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    
    console.log('✅ Validação:', validarRes.data.message);
    console.log('   Válido?:', validarRes.data.valid ? 'SIM' : 'NÃO');
    
    // 5. Marcar ponto com QR Code válido (se ainda estiver válido)
    if (validarRes.data.valid) {
      console.log('\n5. ⏰ Marcando ponto com QR Code válido...');
      const pontoRes = await axios.post(`${API_URL}/ponto/marcar`, {
        session_token: sessionToken,
        latitude: -23.561399,
        longitude: -46.655539,
        tipo_registro: 'entrada'
      }, {
        headers: { Authorization: `Bearer ${tokenAdmin}` }
      });
      
      console.log('✅ Ponto registrado com sucesso!');
      console.log('   Mensagem:', pontoRes.data.message);
      console.log('   Local:', pontoRes.data.local);
      console.log('   Hora:', pontoRes.data.data_hora);
      console.log('   ID do registro:', pontoRes.data.registro?.id);
    } else {
      console.log('\n⚠️  QR Code já foi usado via endpoint /validar, tentando gerar novo...');
      
      // Gerar novo QR Code
      const novoQrcodeRes = await axios.post(`${API_URL}/qrcode/gerar`, {
        local_trabalho_id: localId
      }, {
        headers: { Authorization: `Bearer ${tokenAdmin}` }
      });
      
      const novoSessionToken = novoQrcodeRes.data.data.session_token;
      
      // Marcar ponto com novo QR Code
      const pontoRes = await axios.post(`${API_URL}/ponto/marcar`, {
        session_token: novoSessionToken,
        latitude: -23.561399,
        longitude: -46.655539,
        tipo_registro: 'entrada'
      }, {
        headers: { Authorization: `Bearer ${tokenAdmin}` }
      });
      
      console.log('✅ Ponto registrado com novo QR Code!');
      console.log('   Mensagem:', pontoRes.data.message);
    }
    
    // 6. Verificar pontos do dia
    console.log('\n6. 📊 Verificando pontos hoje...');
    const hojeRes = await axios.get(`${API_URL}/ponto/hoje`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    
    console.log(`✅ ${hojeRes.data.registros?.length || 0} registro(s) hoje:`);
    if (hojeRes.data.registros && hojeRes.data.registros.length > 0) {
      hojeRes.data.registros.forEach((reg, index) => {
        console.log(`   ${index + 1}. ${reg.tipo_registro} - ${reg.timestamp_registro}`);
      });
    }
    
    // 7. Testar histórico
    console.log('\n7. 📅 Testando histórico...');
    const historicoRes = await axios.get(`${API_URL}/ponto/historico`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    
    const datas = Object.keys(historicoRes.data.historico || {});
    console.log(`✅ Histórico com ${datas.length} dia(s) registrado(s)`);
    
    // 8. Testar listagem completa (admin)
    console.log('\n8. 👁️  Listando todos registros (admin)...');
    const todosRes = await axios.get(`${API_URL}/ponto/todos`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    
    console.log(`✅ ${todosRes.data.registros?.length || 0} registro(s) no total`);
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 FLUXO COMPLETO TESTADO COM SUCESSO!');
    console.log('='.repeat(50));
    console.log('✅ Autenticação');
    console.log('✅ Locais de trabalho');
    console.log('✅ QR Code (gerar + validar)');
    console.log('✅ Registro de ponto');
    console.log('✅ Consulta de registros');
    console.log('✅ Histórico');
    console.log('✅ Admin: Listagem completa');
    
  } catch (error) {
    console.error('\n❌ Erro no fluxo:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Erro:', error.response.data?.error || error.response.data);
      
      if (error.response.data?.details) {
        console.log('Detalhes:', error.response.data.details);
      }
    } else {
      console.log('Erro:', error.message);
    }
  }
}

testarFluxoReal();