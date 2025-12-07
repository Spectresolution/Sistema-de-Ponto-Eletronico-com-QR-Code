const bcrypt = require('bcryptjs');

const hashNoBanco = '$2a$10$8K1p/a0dRTlB0Z6F2R8z5.YR3OYDfYYrO6cA6o9o5p5p5p5p5p5p5';
const senhaTeste = 'admin123';

async function testar() {
  console.log('🔐 Testando comparação de senhas...');
  console.log('Hash no banco:', hashNoBanco);
  console.log('Senha testada:', senhaTeste);
  
  try {
    const resultado = await bcrypt.compare(senhaTeste, hashNoBanco);
    console.log('✅ Senha válida?', resultado);
    
    // Teste também gerando um novo hash
    const novoHash = await bcrypt.hash(senhaTeste, 10);
    console.log('🔑 Novo hash gerado:', novoHash);
    console.log('✅ Comparação com novo hash:', await bcrypt.compare(senhaTeste, novoHash));
    
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }
}

testar();
