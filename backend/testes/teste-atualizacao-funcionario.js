// testes/teste-atualizacao.js
const axios = require('axios');
const API_URL = 'http://localhost:3000/api';

async function testarAtualizacao() {
  console.log('🧪 === TESTE DE ATUALIZAÇÃO DE FUNCIONÁRIO ===\n');
  
  let token;
  let funcionarioId;
  
  try {
    // 1. Login como admin
    console.log('1. 🔐 Login como admin...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@email.com',
      senha: 'admin123'
    });
    
    token = loginRes.data.token;
    console.log('✅ Logado como:', loginRes.data.user.email);
    
    // 2. Criar funcionário para testar atualização
    console.log('\n2. ➕ Criando funcionário para teste...');
    const criarRes = await axios.post(`${API_URL}/funcionarios`, {
      nome: 'Funcionário Para Atualizar',
      email: 'atualizar@teste.com',
      senha: 'senha123',
      cpf: '111.222.333-44',
      cargo: 'Cargo Inicial',
      data_contratacao: '2024-01-01',
      departamento: 'Departamento Inicial'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    funcionarioId = criarRes.data.funcionario.id;
    console.log('✅ Funcionário criado:', criarRes.data.funcionario.email);
    console.log('   ID:', funcionarioId);
    
    // 3. Atualizar funcionário (PUT)
    console.log('\n3. ✏️  Atualizando funcionário (PUT)...');
    const atualizacoes = {
      nome: 'Funcionário Atualizado',
      cargo: 'Cargo Atualizado',
      departamento: 'TI',
      jornada_padrao_horas: 7.5,
      is_gestor: true
    };
    
    const putRes = await axios.put(`${API_URL}/funcionarios/${funcionarioId}`, atualizacoes, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ PUT Status:', putRes.status);
    console.log('✅ Mensagem:', putRes.data.message);
    console.log('✅ Dados atualizados:', {
      nome: putRes.data.funcionario.nome,
      cargo: putRes.data.funcionario.cargo,
      is_gestor: putRes.data.funcionario.is_gestor
    });
    
    // 4. Buscar para confirmar
    console.log('\n4. 🔍 Buscando funcionário atualizado...');
    const buscarRes = await axios.get(`${API_URL}/funcionarios/${funcionarioId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Dados confirmados:');
    console.log('   Nome:', buscarRes.data.funcionario.nome);
    console.log('   Cargo:', buscarRes.data.funcionario.cargo);
    console.log('   Departamento:', buscarRes.data.funcionario.departamento);
    console.log('   Jornada:', buscarRes.data.funcionario.jornada_padrao_horas);
    console.log('   is_gestor:', buscarRes.data.funcionario.is_gestor);
    
    // 5. Testar atualização parcial (PATCH)
    console.log('\n5. 🔧 Atualizando status (PATCH)...');
    const patchRes = await axios.patch(`${API_URL}/funcionarios/${funcionarioId}/status`, {
      ativo: false
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ PATCH Status:', patchRes.status);
    console.log('✅ Mensagem:', patchRes.data.message);
    console.log('✅ Ativo:', patchRes.data.funcionario.ativo);
    
    // 6. Verificar na listagem geral
    console.log('\n6. 📋 Listando todos os funcionários...');
    const listarRes = await axios.get(`${API_URL}/funcionarios`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const funcionarioAtualizado = listarRes.data.funcionarios.find(f => f.id === funcionarioId);
    console.log('✅ Status na listagem:', funcionarioAtualizado?.ativo ? 'Ativo' : 'Inativo');
    
    // 7. Testar validações
    console.log('\n7. 🛡️  Testando validações...');
    
    // Tentar atualizar com email duplicado
    try {
      await axios.put(`${API_URL}/funcionarios/${funcionarioId}`, {
        email: 'admin@email.com' // Email já existe (do admin)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('❌ ERRO: Deveria falhar com email duplicado');
    } catch (error) {
      console.log('✅ CORRETO: Impediu email duplicado');
      console.log('   Erro:', error.response?.data?.error);
    }
    
    // 8. Reativar funcionário
    console.log('\n8. ♻️  Reativando funcionário...');
    await axios.patch(`${API_URL}/funcionarios/${funcionarioId}/status`, {
      ativo: true
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Funcionário reativado');
    
  } catch (error) {
    console.error('\n❌ Erro no teste:', error.response?.data || error.message);
  } finally {
    // Limpar teste se funcionário foi criado
    if (token && funcionarioId) {
      try {
        console.log('\n🧹 Limpando teste...');
        await axios.delete(`${API_URL}/funcionarios/${funcionarioId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => {}); // Ignora erro se não tiver endpoint DELETE
        
        // Alternativa: desativar
        await axios.patch(`${API_URL}/funcionarios/${funcionarioId}/status`, {
          ativo: false
        }, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => {});
        
        console.log('✅ Teste limpo');
      } catch (cleanupError) {
        console.log('⚠️  Não foi possível limpar o teste completamente');
      }
    }
  }
  
  console.log('\n🎉 Teste de atualização concluído!');
}

testarAtualizacao();