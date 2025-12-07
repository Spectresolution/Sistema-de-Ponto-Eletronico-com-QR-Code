// reset-database.js (na pasta backend)
const { db } = require('./config/database');
const bcrypt = require('bcryptjs');

async function resetDatabase() {
  console.log('🔄 Reiniciando banco de dados...');
  
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 1. Remover tabelas (na ordem correta por dependências)
      console.log('🗑️  Removendo tabelas...');
      db.run('DROP TABLE IF EXISTS solicitacao_ajuste');
      db.run('DROP TABLE IF EXISTS registro_ponto');
      db.run('DROP TABLE IF EXISTS qrcode_session');
      db.run('DROP TABLE IF EXISTS local_trabalho');
      db.run('DROP TABLE IF EXISTS funcionario');
      
      // 2. Criar tabelas novamente (seu setupDatabase.js atualizado)
      console.log('🏗️  Criando tabelas...');
      
      // Tabela funcionario COM is_gestor
      db.run(`
        CREATE TABLE funcionario (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL,
          cpf TEXT UNIQUE NOT NULL,
          matricula TEXT UNIQUE,
          email TEXT UNIQUE NOT NULL,
          senha_hash TEXT NOT NULL,
          cargo TEXT NOT NULL,
          departamento TEXT, 
          jornada_padrao_horas REAL DEFAULT 8.00,
          data_contratacao TEXT NOT NULL,
          is_admin BOOLEAN DEFAULT 0,
          is_gestor BOOLEAN DEFAULT 0,                   
          gestor_id INTEGER,                             
          ativo BOOLEAN DEFAULT 1, 
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (gestor_id) REFERENCES funcionario(id) 
        )
      `);
      
      // Outras tabelas (mantenha como está no seu setupDatabase.js)
      db.run(`
        CREATE TABLE local_trabalho (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome_local TEXT NOT NULL,
          endereco TEXT,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          raio_tolerancia_metros INTEGER DEFAULT 100,
          ativo BOOLEAN DEFAULT 1
        )
      `);
      
      // ... outras tabelas (qrcode_session, registro_ponto, solicitacao_ajuste)
      
      // 3. Criar admin inicial
      console.log('👑 Criando admin inicial...');
      bcrypt.hash('admin123', 10).then(hash => {
        db.run(
          `INSERT INTO funcionario 
          (nome, email, senha_hash, cpf, cargo, data_contratacao, is_admin, is_gestor) 
          VALUES (?, ?, ?, ?, ?, date('now'), 1, 1)`,
          ['Administrador', 'admin@email.com', hash, '000.000.001-00', 'Administrador'],
          function(err) {
            if (err) {
              console.error('❌ Erro ao criar admin:', err.message);
              reject(err);
            } else {
              console.log('✅ Admin criado! ID:', this.lastID);
              
              // 4. Verificar
              db.all('SELECT id, nome, email, is_admin, is_gestor, ativo FROM funcionario', (err, rows) => {
                if (err) {
                  console.error('❌ Erro ao verificar:', err.message);
                  reject(err);
                } else {
                  console.log('\n📋 Banco de dados resetado com sucesso!');
                  console.log('👥 Funcionários no sistema:');
                  rows.forEach(r => console.log(`- ${r.id}: ${r.nome} (${r.email}) Admin:${r.is_admin} Gestor:${r.is_gestor}`));
                  resolve();
                }
              });
            }
          }
        );
      }).catch(err => {
        console.error('❌ Erro no hash:', err);
        reject(err);
      });
    });
  });
}

// Executar se chamado diretamente
if (require.main === module) {
  resetDatabase()
    .then(() => {
      console.log('\n🎉 Banco resetado com sucesso!');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ Erro ao resetar banco:', err);
      process.exit(1);
    });
}

module.exports = { resetDatabase };