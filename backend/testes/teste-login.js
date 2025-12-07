// test-login-simples.js
const axios = require('axios');

async function testarLogin() {
  try {
    console.log('🔐 Testando login...\n');
    
    const resposta = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@email.com',
      senha: 'admin123'
    });
    
    console.log('✅ LOGIN BEM-SUCEDIDO!');
    console.log('Status:', resposta.status);
    console.log('\n📦 Dados da resposta:');
    console.log('- Token (início):', resposta.data.token.substring(0, 50) + '...');
    console.log('- Usuário:', resposta.data.user.email);
    console.log('- is_admin:', resposta.data.user.is_admin);
    console.log('- is_gestor:', resposta.data.user.is_gestor);
    
    // Testar o token
    const token = resposta.data.token;
    
    console.log('\n🔍 Testando listagem de funcionários com o token...');
    
    try {
      const funcionariosRes = await axios.get('http://localhost:3000/api/funcionarios', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ LISTAGEM BEM-SUCEDIDA!');
      console.log('Total de funcionários:', funcionariosRes.data.funcionarios?.length || 0);
      
    } catch (erroListagem) {
      console.log('❌ ERRO na listagem:');
      console.log('Status:', erroListagem.response?.status);
      console.log('Erro:', erroListagem.response?.data?.error || erroListagem.response?.data);
      console.log('\n🔍 Mostre o log do servidor para ver o que aconteceu.');
    }
    
  } catch (error) {
    console.log('❌ ERRO NO LOGIN:');
    console.log('Status:', error.response?.status);
    console.log('Erro:', error.response?.data?.error || error.response?.data);
    
    if (error.response?.status === 500) {
      console.log('\n🔍 Verifique o log do servidor para ver o erro completo.');
    }
  }
}

testarLogin();