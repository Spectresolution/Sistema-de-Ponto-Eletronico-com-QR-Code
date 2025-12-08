// testes/teste-verifica-endpoints.js
const axios = require('axios');
const API_URL = 'http://localhost:3000/api';

async function verificarEndpoints() {
  console.log('🔍 VERIFICANDO ENDPOINTS DO SISTEMA\n');
  
  try {
    // 1. Login primeiro
    console.log('1. 🔐 Fazendo login...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@email.com',
      senha: 'admin123'
    });
    
    const token = loginRes.data.token;
    console.log('✅ Login OK - Token obtido');
    
    // 2. Listar endpoints a verificar
    const endpoints = [
      { method: 'GET', path: '/locais', desc: 'Listar locais' },
      { method: 'POST', path: '/locais', desc: 'Criar local' },
      { method: 'POST', path: '/qrcode/gerar', desc: 'Gerar QR Code' },
      { method: 'POST', path: '/qrcode/validar', desc: 'Validar QR Code' },
      { method: 'POST', path: '/ponto/marcar', desc: 'Marcar ponto' },
      { method: 'GET', path: '/ponto/hoje', desc: 'Pontos hoje' }
    ];
    
    console.log('\n2. 📋 Verificando endpoints...');
    
    for (const endpoint of endpoints) {
      try {
        const config = {
          method: endpoint.method.toLowerCase(),
          url: `${API_URL}${endpoint.path}`,
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 3000,
          validateStatus: () => true // Aceita qualquer status para teste
        };
        
        // Dados mínimos para POST
        if (endpoint.method === 'POST') {
          if (endpoint.path === '/locais') {
            config.data = {
              nome_local: 'Teste',
              latitude: -23.550520,
              longitude: -46.633308
            };
          } else if (endpoint.path === '/qrcode/gerar') {
            config.data = {
              local_trabalho_id: 1 // Tentaremos com ID 1
            };
          } else if (endpoint.path === '/qrcode/validar') {
            config.data = {
              session_token: 'testetoken123'
            };
          } else if (endpoint.path === '/ponto/marcar') {
            config.data = {
              session_token: 'testetoken123',
              latitude: -23.550520,
              longitude: -46.633308,
              tipo_registro: 'entrada'
            };
          }
        }
        
        const response = await axios(config);
        
        if (response.status === 200 || response.status === 201) {
          console.log(`✅ ${endpoint.method} ${endpoint.path} - OK (${response.status})`);
        } else if (response.status === 400 || response.status === 404) {
          console.log(`⚠️  ${endpoint.method} ${endpoint.path} - ENDPOINT EXISTE (erro: ${response.status})`);
          if (response.data?.error) {
            console.log(`   ↳ ${response.data.error}`);
          }
        } else if (response.status === 500) {
          console.log(`🔧 ${endpoint.method} ${endpoint.path} - ERRO INTERNO (${response.status})`);
          console.log(`   ↳ ${response.data?.error || 'Verifique os logs do servidor'}`);
        }
        
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.log(`❌ ${endpoint.method} ${endpoint.path} - SERVIDOR NÃO RESPONDE`);
        } else if (error.response?.status === 404) {
          console.log(`❌ ${endpoint.method} ${endpoint.path} - NÃO ENCONTRADO (404)`);
        } else {
          console.log(`❓ ${endpoint.method} ${endpoint.path} - ERRO: ${error.message}`);
        }
      }
    }
    
    console.log('\n📊 RESUMO:');
    console.log('✅ - Endpoint funciona');
    console.log('⚠️  - Endpoint existe mas tem erro de validação');
    console.log('🔧 - Endpoint tem erro interno (verificar código)');
    console.log('❌ - Endpoint não encontrado ou servidor off');
    console.log('❓ - Outro erro');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

verificarEndpoints();