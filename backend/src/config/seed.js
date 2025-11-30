const { pool } = require('./database');
const { hashPassword } = require('../utils/helpers');

const seedData = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    console.log('🌱 Iniciando seed de dados...');

    // Inserir locais de trabalho de exemplo
    await client.query(`
      INSERT INTO local_trabalho 
      (nome_local, endereco, latitude, longitude, raio_tolerancia_metros) 
      VALUES 
      ('Prefeitura Municipal - Sede', 'Praça da Matriz, 100 - Centro', -23.550520, -46.633308, 100),
      ('Secretaria de Educação', 'Rua das Flores, 250 - Centro', -23.551000, -46.634000, 80),
      ('Secretaria de Saúde', 'Av. Principal, 500 - Jardim', -23.552000, -46.635000, 120)
      ON CONFLICT DO NOTHING;
    `);

    // Inserir funcionários de exemplo (senha: 123456)
    const senhaHash = await hashPassword('123456');
    
    await client.query(`
      INSERT INTO funcionario 
      (nome, email, senha_hash, cpf, cargo, departamento, data_contratacao, is_gestor) 
      VALUES 
      ('Carlos Santos', 'carlos.santos@prefeitura.gov.br', $1, '123.456.789-00', 'Gestor de Equipe', 'Secretaria de Educação', '2023-01-15', true),
      ('Ana Oliveira', 'ana.oliveira@prefeitura.gov.br', $1, '987.654.321-00', 'Assistente Administrativo', 'Secretaria de Educação', '2023-03-20', false),
      ('Pedro Costa', 'pedro.costa@prefeitura.gov.br', $1, '456.789.123-00', 'Analista Financeiro', 'Secretaria de Finanças', '2023-02-10', false)
      ON CONFLICT (email) DO NOTHING;
    `, [senhaHash]);

    await client.query('COMMIT');
    console.log('✅ Seed concluído com sucesso!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro no seed:', error);
  } finally {
    client.release();
    process.exit();
  }
};

seedData();