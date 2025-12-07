// test-completo-ajustado.js
const axios = require('axios');
const API_URL = 'http://localhost:3000/api';

async function testarFluxo() {
  try {
    console.log('1. 🔐 Testando login como admin...');
    
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@email.com',
      senha: 'admin123'
    });
    
    const token = loginRes.data.token;
    console.log('✅ Login bem-sucedido');
    console.log('👤 Usuário:', loginRes.data.user.email);
    
    // Testar listagem de funcionários
    console.log('\n2. 👥 Testando listagem de funcionários...');
    const funcionariosRes = await axios.get(`${API_URL}/funcionarios`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Funcionários listados:', funcionariosRes.data.funcionarios?.length || 0);
    
    // Testar criação de funcionário comum COM valores explícitos
    console.log('\n3. ➕ Testando criação de funcionário comum...');
    const novoFuncionario = {
      nome: 'Funcionário Teste 2',
      email: 'teste2@empresa.com',
      senha: 'senha123',
      cpf: '123.456.789-11', // CPF diferente!
      cargo: 'Analista',
      data_contratacao: '2024-01-15',
      is_admin: false,    // EXPLÍCITO
      is_gestor: false    // EXPLÍCITO
    };
    
    try {
      const criarRes = await axios.post(`${API_URL}/funcionarios`, novoFuncionario, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Funcionário criado:', criarRes.data.funcionario?.email);
      console.log('📦 Dados completos:');
      console.log('- is_admin:', criarRes.data.funcionario?.is_admin);
      console.log('- is_gestor:', criarRes.data.funcionario?.is_gestor);
      console.log('- Tipo is_admin:', typeof criarRes.data.funcionario?.is_admin);
      
    } catch (error) {
      console.log('❌ Erro:', error.response?.status);
      console.log('📝 Mensagem:', error.response?.data?.error);
    }
    
    // Testar criação de funcionário SEM os campos booleanos
    console.log('\n4. ➕ Testando criação SEM campos booleanos...');
    const funcionarioSemBooleanos = {
      nome: 'Funcionário Sem Booleanos',
      email: 'sembool@empresa.com',
      senha: 'senha123',
      cpf: '999.888.777-66',
      cargo: 'Assistente',
      data_contratacao: '2024-01-15'
    };
    
    try {
      const criarRes2 = await axios.post(`${API_URL}/funcionarios`, funcionarioSemBooleanos, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Funcionário criado:', criarRes2.data.funcionario?.email);
      console.log('- is_admin:', criarRes2.data.funcionario?.is_admin);
      console.log('- is_gestor:', criarRes2.data.funcionario?.is_gestor);
      
    } catch (error) {
      console.log('❌ Erro:', error.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Dados:', error.response.data);
    } else {
      console.log('Erro:', error.message);
    }
  }
}

testarFluxo();