// testes/teste-ponto.js
const axios = require('axios');
const API_URL = 'http://localhost:3000/api';

async function testarPonto() {
  console.log('🧪 === TESTE DE REGISTRO DE PONTO ===\n');
  
  let tokenAdmin;
  let tokenFunc;
  let funcionarioId;
  let localId;
  
  try {
    // 1. Login como admin
    console.log('1. 🔐 Login como admin...');
    const loginAdminRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@email.com',
      senha: 'admin123'
    });
    
    tokenAdmin = loginAdminRes.data.token;
    console.log('✅ Admin logado');
    
    // 2. Criar local de trabalho
    console.log('\n2. 🏢 Criando local de trabalho...');
    const localRes = await axios.post(`${API_URL}/locais`, {
      nome_local: 'Fábrica Teste',
      endereco: 'Rua Industrial, 500',
      latitude: -23.551000,
      longitude: -46.634000,
      raio_tolerancia_metros: 150
    }, {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    
    localId = localRes.data.local.id;
    console.log('✅ Local criado:', localRes.data.local.nome_local);
    
    // 3. Criar funcionário para teste
    console.log('\n3. 👤 Criando funcionário para teste...');
    const funcionarioRes = await axios.post(`${API_URL}/funcionarios`, {
      nome: 'Operário Teste',
      email: 'operario@teste.com',
      senha: 'senha123',
      cpf: '777.888.999-00',
      cargo: 'Operário',
      data_contratacao: '2024-01-01',
      jornada_padrao_horas: 8
    }, {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    
    funcionarioId = funcionarioRes.data.funcionario.id;
    console.log('✅ Funcionário criado:', funcionarioRes.data.funcionario.nome);
    
    // 4. Login como funcionário
    console.log('\n4. 🔐 Login como funcionário...');
    const loginFuncRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'operario@teste.com',
      senha: 'senha123'
    });
    
    tokenFunc = loginFuncRes.data.token;
    console.log('✅ Funcionário logado');
    
    // 5. Registrar ponto via QR Code
    console.log('\n5. 📱 Gerando QR Code para registro...');
    const qrcodeRes = await axios.post(`${API_URL}/qrcode/gerar`, {
      local_trabalho_id: localId,
      duracao_minutos: 10
    }, {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    
    const sessionToken = qrcodeRes.data.session_token;
    
    // 6. Registrar ENTRADA
    console.log('\n6. ⏰ Registrando ENTRADA...');
    const entradaRes = await axios.post(`${API_URL}/qrcode/validar`, {
      session_token: sessionToken,
      latitude: -23.551000,
      longitude: -46.634000,
      tipo_registro: 'ENTRADA',
      observacoes: 'Chegada ao trabalho'
    }, {
      headers: { Authorization: `Bearer ${tokenFunc}` }
    });
    
    console.log('✅ Entrada registrada!');
    console.log('   ID do registro:', entradaRes.data.registro_ponto.id);
    console.log('   Hora:', entradaRes.data.registro_ponto.timestamp_registro);
    
    // 7. Registrar SAÍDA para intervalo
    console.log('\n7. ⏰ Registrando SAÍDA (intervalo)...');
    
    // Gerar novo QR Code
    const qrcodeRes2 = await axios.post(`${API_URL}/qrcode/gerar`, {
      local_trabalho_id: localId,
      duracao_minutos: 10
    }, {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    
    const saidaRes = await axios.post(`${API_URL}/qrcode/validar`, {
      session_token: qrcodeRes2.data.session_token,
      latitude: -23.551000,
      longitude: -46.634000,
      tipo_registro: 'SAIDA',
      observacoes: 'Saindo para intervalo'
    }, {
      headers: { Authorization: `Bearer ${tokenFunc}` }
    });
    
    console.log('✅ Saída registrada!');
    
    // 8. Registrar RETORNO
    console.log('\n8. ⏰ Registrando RETORNO...');
    const qrcodeRes3 = await axios.post(`${API_URL}/qrcode/gerar`, {
      local_trabalho_id: localId,
      duracao_minutos: 10
    }, {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    
    const retornoRes = await axios.post(`${API_URL}/qrcode/validar`, {
      session_token: qrcodeRes3.data.session_token,
      latitude: -23.551000,
      longitude: -46.634000,
      tipo_registro: 'ENTRADA',
      observacoes: 'Retorno do intervalo'
    }, {
      headers: { Authorization: `Bearer ${tokenFunc}` }
    });
    
    console.log('✅ Retorno registrado!');
    
    // 9. Registrar SAÍDA FINAL
    console.log('\n9. ⏰ Registrando SAÍDA FINAL...');
    const qrcodeRes4 = await axios.post(`${API_URL}/qrcode/gerar`, {
      local_trabalho_id: localId,
      duracao_minutos: 10
    }, {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    
    const saidaFinalRes = await axios.post(`${API_URL}/qrcode/validar`, {
      session_token: qrcodeRes4.data.session_token,
      latitude: -23.551000,
      longitude: -46.634000,
      tipo_registro: 'SAIDA',
      observacoes: 'Fim do expediente'
    }, {
      headers: { Authorization: `Bearer ${tokenFunc}` }
    });
    
    console.log('✅ Saída final registrada!');
    
    // 10. Verificar registros do funcionário
    console.log('\n10. 📊 Verificando registros do funcionário...');
    const meusRegistrosRes = await axios.get(`${API_URL}/ponto/meus-registros`, {
      headers: { Authorization: `Bearer ${tokenFunc}` }
    });
    
    console.log(`✅ ${meusRegistrosRes.data.registros.length} registro(s) no total:`);
    meusRegistrosRes.data.registros.forEach((reg, index) => {
      console.log(`   ${index + 1}. ${reg.tipo_registro} - ${reg.timestamp_registro}${reg.observacoes ? ` (${reg.observacoes})` : ''}`);
    });
    
    // 11. Admin vendo todos os registros
    console.log('\n11. 👁️  Admin vendo todos os registros...');
    const todosRegistrosRes = await axios.get(`${API_URL}/ponto/registros`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    
    console.log(`✅ ${todosRegistrosRes.data.registros.length} registro(s) no sistema:`);
    todosRegistrosRes.data.registros.slice(0, 5).forEach(reg => {
      console.log(`   - ${reg.funcionario_nome}: ${reg.tipo_registro} às ${reg.timestamp_registro}`);
    });
    
    if (todosRegistrosRes.data.registros.length > 5) {
      console.log(`   ... e mais ${todosRegistrosRes.data.registros.length - 5} registro(s)`);
    }
    
    // 12. Testar relatório de horas
    console.log('\n12. 📈 Testando relatório de horas...');
    const hoje = new Date().toISOString().split('T')[0];
    
    try {
      const relatorioRes = await axios.get(`${API_URL}/ponto/relatorio?data=${hoje}`, {
        headers: { Authorization: `Bearer ${tokenAdmin}` }
      });
      
      console.log('✅ Relatório gerado para', hoje);
      console.log('   Total funcionários:', relatorioRes.data.total_funcionarios);
      console.log('   Registros no dia:', relatorioRes.data.total_registros);
      
      if (relatorioRes.data.registros_por_funcionario) {
        console.log('   Registros por funcionário:');
        Object.entries(relatorioRes.data.registros_por_funcionario).forEach(([nome, registros]) => {
          console.log(`     ${nome}: ${registros.length} registro(s)`);
        });
      }
    } catch (error) {
      console.log('⚠️  Endpoint de relatório não implementado ou erro:', error.response?.data?.error || error.message);
    }
    
    // 13. Testar solicitação de ajuste
    console.log('\n13. 📝 Testando solicitação de ajuste...');
    
    // Funcionário solicita ajuste
    const ajusteRes = await axios.post(`${API_URL}/ponto/solicitar-ajuste`, {
      data_alvo: hoje,
      tipo_ajuste: 'AJUSTE_HORARIO',
      justificativa: 'Esqueci de registrar a entrada',
      hora_solicitada: '08:30'
    }, {
      headers: { Authorization: `Bearer ${tokenFunc}` }
    });
    
    console.log('✅ Solicitação de ajuste criada!');
    console.log('   ID:', ajusteRes.data.solicitacao.id);
    console.log('   Status:', ajusteRes.data.solicitacao.status);
    
    const solicitacaoId = ajusteRes.data.solicitacao.id;
    
    // 14. Admin visualizando solicitações
    console.log('\n14. 📋 Admin vendo solicitações pendentes...');
    const solicitacoesRes = await axios.get(`${API_URL}/ponto/solicitacoes`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    
    console.log(`✅ ${solicitacoesRes.data.solicitacoes.length} solicitação(ões):`);
    solicitacoesRes.data.solicitacoes.forEach(sol => {
      console.log(`   - ${sol.funcionario_nome}: ${sol.tipo_ajuste} (${sol.status})`);
    });
    
    // 15. Aprovar solicitação
    console.log('\n15. ✅ Aprovando solicitação...');
    const aprovarRes = await axios.patch(`${API_URL}/ponto/solicitacoes/${solicitacaoId}/status`, {
      status: 'APROVADA',
      observacao_gestor: 'Ajuste aprovado conforme justificativa'
    }, {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    
    console.log('✅ Solicitação aprovada!');
    console.log('   Novo status:', aprovarRes.data.solicitacao.status);
    
  } catch (error) {
    console.error('\n❌ Erro no teste:', error.response?.data || error.message);
    if (error.response?.status === 404) {
      console.log('⚠️  Algum endpoint não está implementado ainda');
    }
  } finally {
    // Limpar
    console.log('\n🧹 Limpando testes...');
    // (Opcional: adicione limpeza se necessário)
  }
  
  console.log('\n🎉 Teste de registro de ponto concluído!');
}

testarPonto();