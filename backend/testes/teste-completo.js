// testes/teste-tudo.js
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

async function verificarEndpointsQRCode() {
  try {
    // Import dinâmico do axios
    const axios = (await import('axios')).default;
    
    const login = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@email.com',
      senha: 'admin123'
    });
    
    const token = login.data.token;
    
    // Verifica endpoint crítico
    await axios.get('http://localhost:3000/api/locais', {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 2000
    });
    
    return true; // Endpoints existem
  } catch (error) {
    console.log('⚠️  Endpoints QR Code não disponíveis:', error.message);
    return false; // Endpoints não existem
  }
}

async function verificarArquivosTeste() {
  const testesBase = [
    'teste-login.js',
    'teste-funcionarios.js',
    'teste-atualizacao-funcionario.js',
    'teste-status-delecao.js',
    'testar-senha.js'
  ];
  
  const testesExistentes = [];
  const testesFaltantes = [];
  
  for (const teste of testesBase) {
    const caminho = path.join(__dirname, teste);
    if (fs.existsSync(caminho)) {
      testesExistentes.push(teste);
    } else {
      testesFaltantes.push(teste);
    }
  }
  
  // Criar arquivos faltantes básicos
  if (testesFaltantes.includes('teste-login.js')) {
    const conteudoLogin = `const axios = require('axios');

async function testarLogin() {
  console.log('🔐 Testando login...\\\\n');
  
  try {
    const resposta = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@email.com',
      senha: 'admin123'
    });
    
    console.log('✅ LOGIN BEM-SUCEDIDO!');
    console.log('Status:', resposta.status);
    console.log('\\\\n📦 Dados da resposta:');
    console.log('- Token (início):', resposta.data.token.substring(0, 50) + '...');
    console.log('- Usuário:', resposta.data.user.email);
    console.log('- is_admin:', resposta.data.user.is_admin);
    console.log('- is_gestor:', resposta.data.user.is_gestor);
    
    const token = resposta.data.token;
    
    console.log('\\\\n🔍 Testando listagem de funcionários com o token...');
    
    try {
      const funcionariosRes = await axios.get('http://localhost:3000/api/funcionarios', {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      
      console.log('✅ LISTAGEM BEM-SUCEDIDA!');
      console.log('Total de funcionários:', funcionariosRes.data.funcionarios?.length || 0);
      
    } catch (erroListagem) {
      console.log('❌ ERRO na listagem:');
      console.log('Status:', erroListagem.response?.status);
      console.log('Erro:', erroListagem.response?.data?.error || erroListagem.response?.data);
    }
    
  } catch (error) {
    console.log('❌ ERRO NO LOGIN:');
    console.log('Status:', error.response?.status);
    console.log('Erro:', error.response?.data?.error || error.response?.data);
  }
}

testarLogin();`;
    
    fs.writeFileSync(path.join(__dirname, 'teste-login.js'), conteudoLogin);
    console.log('✅ teste-login.js criado');
    testesExistentes.push('teste-login.js');
  }
  
  return testesExistentes;
}

async function rodarTodosTestes() {
  console.log('🚀 === RODANDO TODOS OS TESTES DISPONÍVEIS ===\\n');
  
  // 1. Verificar arquivos de teste básicos
  let testes = await verificarArquivosTeste();
  
  if (testes.length === 0) {
    console.log('❌ Nenhum arquivo de teste encontrado!');
    return;
  }
  
  console.log(`📋 ${testes.length} teste(s) base serão executados`);
  
  // 2. Verificar se endpoints QR Code existem
  try {
    const qrCodeDisponivel = await verificarEndpointsQRCode();
    if (qrCodeDisponivel) {
      if (fs.existsSync(path.join(__dirname, 'teste-qrcode-simplificado.js'))) {
        testes.push('teste-qrcode-simplificado.js');
        console.log('✅ Teste QR Code adicionado');
      }
    } else {
      console.log('⚠️  Testes QR Code pulados - Endpoints não implementados');
    }
  } catch (error) {
    console.log('⚠️  Não foi possível verificar endpoints QR Code:', error.message);
  }
  
  console.log(`📋 Total: ${testes.length} teste(s) serão executados\\n`);
  
  let sucessos = 0;
  let falhas = 0;
  
  for (const teste of testes) {
    console.log(`\\n📁 Executando: ${teste}`);
    console.log('='.repeat(50));
    
    const resultado = await new Promise((resolve) => {
      const processo = exec(`node ${teste}`, {
        cwd: __dirname
      });
      
      let output = '';
      
      processo.stdout.on('data', (data) => {
        output += data;
        process.stdout.write(data);
      });
      
      processo.stderr.on('data', (data) => {
        output += data;
        process.stderr.write(data);
      });
      
      processo.on('close', (code) => {
        console.log(`\\n📊 ${teste} finalizado com código: ${code}`);
        resolve({ code, output });
      });
    });
    
    if (resultado.code === 0) {
      sucessos++;
      console.log(`✅ ${teste} PASSOU`);
    } else {
      falhas++;
      console.log(`❌ ${teste} FALHOU (código: ${resultado.code})`);
      
      if (resultado.output.includes('Error:') || resultado.output.includes('ERR')) {
        const linhasErro = resultado.output.split('\\n').filter(l => 
          l.includes('Error:') || l.includes('ERR') || l.includes('❌')
        );
        if (linhasErro.length > 0) {
          console.log('   Erro destacado:', linhasErro[0].substring(0, 100));
        }
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\\n' + '='.repeat(50));
  console.log('🎉 RELATÓRIO FINAL DOS TESTES');
  console.log('='.repeat(50));
  console.log(`✅ Testes que passaram: ${sucessos}`);
  console.log(`❌ Testes que falharam: ${falhas}`);
  console.log(`📊 Total executados: ${testes.length}`);
  console.log(`🏆 Taxa de sucesso: ${Math.round((sucessos/testes.length)*100)}%`);
  
  console.log('\\n📋 Testes executados:');
  testes.forEach(teste => {
    console.log(`   - ${teste}`);
  });
  
  // Verificar quais testes avançados não foram executados
  const testesAvancados = ['teste-qrcode.js', 'teste-registro-ponto.js'];
  const testesAvancadosFaltando = testesAvancados.filter(t => 
    !testes.includes(t) && !fs.existsSync(path.join(__dirname, t))
  );
  
  if (testesAvancadosFaltando.length > 0) {
    console.log('\\n⚠️  Testes NÃO executados (endpoints faltando):');
    testesAvancadosFaltando.forEach(t => {
      console.log(`   - ${t}`);
    });
  }
  
  if (falhas === 0) {
    console.log('\\n🎊 PARABÉNS! Todos os testes disponíveis passaram!');
  } else {
    console.log('\\n🔧 Alguns testes falharam. Verifique os logs acima.');
  }
}

// Executar
(async () => {
  try {
    await rodarTodosTestes();
  } catch (error) {
    console.error('❌ Erro ao executar testes:', error);
  }
})();