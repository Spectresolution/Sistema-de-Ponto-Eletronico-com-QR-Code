// testes/teste-status.js
const axios = require('axios');
const API_URL = 'http://localhost:3000/api';

async function testarStatus() {
  console.log('🧪 === TESTE DE STATUS/DELEÇÃO DE FUNCIONÁRIO ===\n');
  
  let token;
  let funcionarioIds = [];
  
  try {
    // 1. Login como admin
    console.log('1. 🔐 Login como admin...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@email.com',
      senha: 'admin123'
    });
    
    token = loginRes.data.token;
    console.log('✅ Logado como:', loginRes.data.user.email);
    
    // 2. Criar funcionários para teste
    console.log('\n2. ➕ Criando funcionários para teste...');
    const funcionariosTeste = [
      {
        nome: 'Funcionário Ativo Teste',
        email: 'ativo@teste.com',
        senha: 'senha123',
        cpf: '111.222.333-55',
        cargo: 'Teste Ativo',
        data_contratacao: '2024-01-01'
      },
      {
        nome: 'Funcionário Inativo Teste',
        email: 'inativo@teste.com',
        senha: 'senha123',
        cpf: '222.333.444-66',
        cargo: 'Teste Inativo',
        data_contratacao: '2024-01-01'
      }
    ];
    
    for (const func of funcionariosTeste) {
      const criarRes = await axios.post(`${API_URL}/funcionarios`, func, {
        headers: { Authorization: `Bearer ${token}` }
      });
      funcionarioIds.push(criarRes.data.funcionario.id);
      console.log(`✅ ${func.nome} criado (ID: ${criarRes.data.funcionario.id})`);
    }
    
    // 3. Listar funcionários ativos
    console.log('\n3. 📋 Listando funcionários ATIVOS...');
    const ativosRes = await axios.get(`${API_URL}/funcionarios?ativo=true`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ ${ativosRes.data.funcionarios.length} funcionário(s) ativo(s):`);
    ativosRes.data.funcionarios.forEach(f => {
      console.log(`   - ${f.nome} (${f.email})`);
    });
    
    // 4. Desativar um funcionário
    console.log(`\n4. ⬇️  Desativando funcionário ID ${funcionarioIds[0]}...`);
    const desativarRes = await axios.patch(`${API_URL}/funcionarios/${funcionarioIds[0]}/status`, {
      ativo: false
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Status:', desativarRes.data.message);
    console.log('✅ Dados:', desativarRes.data.funcionario);
    
    // 5. Listar funcionários inativos
    console.log('\n5. 📋 Listando funcionários INATIVOS...');
    const inativosRes = await axios.get(`${API_URL}/funcionarios?ativo=false`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ ${inativosRes.data.funcionarios.length} funcionário(s) inativo(s):`);
    inativosRes.data.funcionarios.forEach(f => {
      console.log(`   - ${f.nome} (${f.email})`);
    });
    
    // 6. Tentar login com funcionário inativo
    console.log('\n6. 🔐 Tentando login com funcionário INATIVO...');
    try {
      await axios.post(`${API_URL}/auth/login`, {
        email: 'ativo@teste.com',
        senha: 'senha123'
      });
      console.log('❌ ERRO: Login com inativo deveria falhar');
    } catch (error) {
      console.log('✅ CORRETO: Login bloqueado para inativo');
      console.log('   Erro:', error.response?.data?.error);
    }
    
    // 7. Reativar funcionário
    console.log(`\n7. ⬆️  Reativando funcionário ID ${funcionarioIds[0]}...`);
    const reativarRes = await axios.patch(`${API_URL}/funcionarios/${funcionarioIds[0]}/status`, {
      ativo: true
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Status:', reativarRes.data.message);
    
    // 8. Testar login após reativação
    console.log('\n8. 🔐 Testando login após reativação...');
    try {
      const loginAtivo = await axios.post(`${API_URL}/auth/login`, {
        email: 'ativo@teste.com',
        senha: 'senha123'
      });
      console.log('✅ Login bem-sucedido após reativação');
      console.log('   Token gerado:', loginAtivo.data.token.substring(0, 30) + '...');
    } catch (error) {
      console.log('❌ ERRO: Login falhou após reativação');
    }
    
    // 9. Testar permissões - gestor tentando alterar status
    console.log('\n9. 🛡️  Testando permissões...');
    
    // Criar um gestor
    const gestorRes = await axios.post(`${API_URL}/funcionarios`, {
      nome: 'Gestor Teste',
      email: 'gestor@teste.com',
      senha: 'gestor123',
      cpf: '333.444.555-77',
      cargo: 'Gestor',
      data_contratacao: '2024-01-01',
      is_gestor: true
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const gestorId = gestorRes.data.funcionario.id;
    console.log('✅ Gestor criado:', gestorRes.data.funcionario.email);
    
    // Login como gestor
    const loginGestor = await axios.post(`${API_URL}/auth/login`, {
      email: 'gestor@teste.com',
      senha: 'gestor123'
    });
    
    const tokenGestor = loginGestor.data.token;
    console.log('✅ Gestor logado');
    
    // Gestor tentando alterar status (deveria falhar - apenas admin)
    try {
      await axios.patch(`${API_URL}/funcionarios/${gestorId}/status`, {
        ativo: false
      }, {
        headers: { Authorization: `Bearer ${tokenGestor}` }
      });
      console.log('❌ ERRO: Gestor conseguiu alterar status');
    } catch (error) {
      console.log('✅ CORRETO: Gestor não pode alterar status');
      console.log('   Erro:', error.response?.data?.error);
    }
    
    funcionarioIds.push(gestorId);
    
  } catch (error) {
    console.error('\n❌ Erro no teste:', error.response?.data || error.message);
  } finally {
    // Limpar testes
    if (token && funcionarioIds.length > 0) {
      try {
        console.log('\n🧹 Limpando testes...');
        for (const id of funcionarioIds) {
          await axios.patch(`${API_URL}/funcionarios/${id}/status`, {
            ativo: false
          }, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => {});
        }
        console.log(`✅ ${funcionarioIds.length} teste(s) limpo(s)`);
      } catch (cleanupError) {
        console.log('⚠️  Não foi possível limpar os testes completamente');
      }
    }
  }
  
  console.log('\n🎉 Teste de status/deleção concluído!');
}

testarStatus();