const { db } = require('./database');

const createTables = async () => {
  return new Promise((resolve, reject) => {
    console.log('🔄 Criando tabelas...');
    
    db.serialize(() => {
      // Tabela funcionario
      db.run(`
        CREATE TABLE IF NOT EXISTS funcionario (
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

      // Tabela local_trabalho
      db.run(`
        CREATE TABLE IF NOT EXISTS local_trabalho (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome_local TEXT NOT NULL,
          endereco TEXT,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          raio_tolerancia_metros INTEGER DEFAULT 100,
          ativo BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tabela qrcode_session
      db.run(`
        CREATE TABLE IF NOT EXISTS qrcode_session (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_token TEXT UNIQUE NOT NULL,
          local_trabalho_id INTEGER NOT NULL,
          expires_at INTEGER NOT NULL, -- TIMESTAMP em milissegundos
          used BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (local_trabalho_id) REFERENCES local_trabalho(id)
        )
      `);

      // Tabela registro_ponto
      db.run(`
        CREATE TABLE IF NOT EXISTS registro_ponto (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          funcionario_id INTEGER NOT NULL,
          timestamp_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
          tipo_registro TEXT NOT NULL,
          latitude_marcada REAL,
          longitude_marcada REAL,
          local_validado_id INTEGER,
          qrcode_session_id INTEGER,
          observacoes TEXT,
          FOREIGN KEY (funcionario_id) REFERENCES funcionario(id),
          FOREIGN KEY (local_validado_id) REFERENCES local_trabalho(id),
          FOREIGN KEY (qrcode_session_id) REFERENCES qrcode_session(id)
        )
      `);

      // Tabela solicitacao_ajuste
      db.run(`
        CREATE TABLE IF NOT EXISTS solicitacao_ajuste (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          funcionario_id INTEGER NOT NULL,
          registro_ponto_id INTEGER,
          data_alvo TEXT NOT NULL,
          hora_solicitada TEXT,
          tipo_ajuste TEXT NOT NULL,
          justificativa TEXT NOT NULL,
          status TEXT DEFAULT 'PENDENTE',
          data_solicitacao DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (funcionario_id) REFERENCES funcionario(id),
          FOREIGN KEY (registro_ponto_id) REFERENCES registro_ponto(id)
        )
      `);

      // Tabela para dispositivos/autorização web
      db.run(`
        CREATE TABLE IF NOT EXISTS dispositivo_autorizacao (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          funcionario_id INTEGER NOT NULL,
          device_hash TEXT NOT NULL,
          user_agent TEXT,
          data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          ultimo_acesso TIMESTAMP,
          FOREIGN KEY (funcionario_id) REFERENCES funcionario(id),
          UNIQUE(funcionario_id, device_hash)
        )
      `);

      // Tabela para sessões web 
      db.run(`
        CREATE TABLE IF NOT EXISTS sessao_web (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          funcionario_id INTEGER NOT NULL,
          session_token TEXT UNIQUE NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          device_hash TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (funcionario_id) REFERENCES funcionario(id)
        )
      `);
      
      // Verificar criação
      db.run('SELECT 1', (err) => {
        if (err) {
          console.error('❌ Erro ao criar tabelas:', err);
          reject(err);
        } else {
          console.log('✅ Tabelas criadas/verificadas com sucesso!');
          resolve();
        }
      });
    });
  });
};

module.exports = { createTables };