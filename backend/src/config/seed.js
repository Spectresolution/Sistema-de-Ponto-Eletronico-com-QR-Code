// seed.js
const { pool } = require('./database');
const { hashPassword } = require('../utils/helpers');

const seedData = async () => {
  try {
    console.log('🌱 Iniciando seed de dados...');

    // 1️⃣ Inserir locais de trabalho (idempotente)
    const locais = [
      { nome: 'Prefeitura Municipal - Sede', endereco: 'Praça da Matriz, 100 - Centro', lat: -23.550520, lng: -46.633308, raio: 100 },
      { nome: 'Secretaria de Educação', endereco: 'Rua das Flores, 250 - Centro', lat: -23.551000, lng: -46.634000, raio: 80 },
      { nome: 'Secretaria de Saúde', endereco: 'Av. Principal, 500 - Jardim', lat: -23.552000, lng: -46.635000, raio: 120 }
    ];

    for (const local of locais) {
      const exists = await pool.query(`SELECT id FROM local_trabalho WHERE nome_local = ?`, [local.nome]);
      if (exists.rowCount === 0) {
        await pool.query(
          `INSERT INTO local_trabalho (nome_local, endereco, latitude, longitude, raio_tolerancia_metros) 
           VALUES (?, ?, ?, ?, ?)`,
          [local.nome, local.endereco, local.lat, local.lng, local.raio]
        );
        console.log(`✅ Local criado: ${local.nome}`);
      } else {
        console.log(`⚠️ Local já existe: ${local.nome}`);
      }
    }

    // 2️⃣ Inserir admin (idempotente)
    const adminEmail = 'admin@teste.com';
    const adminSenha = 'minhasenha';
    const adminExists = await pool.query(`SELECT id FROM funcionario WHERE email = ?`, [adminEmail]);
    
    if (adminExists.rowCount === 0) {
      const senhaHashAdmin = await hashPassword(adminSenha);
      await pool.query(
        `INSERT INTO funcionario 
          (nome, email, senha_hash, cpf, cargo, departamento, data_contratacao, is_admin, is_gestor) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Admin', adminEmail, senhaHashAdmin, '000.000.000-00', 'Administrador', 'TI', new Date().toISOString(), 1, 1]
      );
      console.log('✅ Admin criado');
    } else {
      console.log(`⚠️ Admin já existe, ID: ${adminExists.rows[0].id}`);
    }

    // 3️⃣ Inserir funcionários de exemplo (idempotente)
    const funcionarios = [
      { nome: 'Carlos Santos', email: 'carlos.santos@prefeitura.gov.br', cpf: '123.456.789-00', cargo: 'Gestor de Equipe', dept: 'Secretaria de Educação', isGestor: 1, data: '2023-01-15' },
      { nome: 'Ana Oliveira', email: 'ana.oliveira@prefeitura.gov.br', cpf: '987.654.321-00', cargo: 'Assistente Administrativo', dept: 'Secretaria de Educação', isGestor: 0, data: '2023-03-20' },
      { nome: 'Pedro Costa', email: 'pedro.costa@prefeitura.gov.br', cpf: '456.789.123-00', cargo: 'Analista Financeiro', dept: 'Secretaria de Finanças', isGestor: 0, data: '2023-02-10' }
    ];

    for (const f of funcionarios) {
      try {
        const exists = await pool.query(`SELECT id FROM funcionario WHERE email = ?`, [f.email]);
        if (exists.rowCount === 0) {
          const senhaHash = await hashPassword('123456'); // senha padrão
          await pool.query(
            `INSERT INTO funcionario 
              (nome, email, senha_hash, cpf, cargo, departamento, data_contratacao, is_gestor) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [f.nome, f.email, senhaHash, f.cpf, f.cargo, f.dept, new Date(f.data).toISOString(), f.isGestor]
          );
          console.log(`✅ Funcionário criado: ${f.nome}`);
        } else {
          console.log(`⚠️ Funcionário já existe: ${f.nome}`);
        }
      } catch (err) {
        console.error(`❌ Erro ao criar funcionário ${f.nome}:`, err.message);
      }
    }

    console.log('🌟 Seed concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro no seed:', error.message);
  } finally {
    process.exit();
  }
};

// Executar apenas se chamado diretamente
if (require.main === module) {
  seedData();
} else {
  module.exports = { seedData };
}
