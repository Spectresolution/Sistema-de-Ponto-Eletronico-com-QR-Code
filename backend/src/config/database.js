const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { hashPassword } = require('../utils/helpers');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../../ponto_eletronico.db');
let db = null;

const createTables = async () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Erro ao conectar com SQLite:', err.message);
        reject(err);
        return;
      }
      console.log('✅ Conectado ao SQLite!');

      // Habilitar chaves estrangeiras
      db.run('PRAGMA foreign_keys = ON');

      // Criar tabelas
      db.serialize(() => {
        // Tabela funcionario
       db.run(`
  CREATE TABLE IF NOT EXISTS funcionario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    cargo TEXT NOT NULL,
    data_contratacao TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT 0,
    is_gestor BOOLEAN DEFAULT 0,                   
    gestor_id INTEGER,                             
    ativo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gestor_id) REFERENCES funcionario(id) 
  )
`);

        // Tabela local_trabalho
        db.run(`
          CREATE TABLE IF NOT EXISTS local_trabalho (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome_local TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            raio_tolerancia_metros INTEGER DEFAULT 100,
            ativo BOOLEAN DEFAULT 1
          )
        `);

        // Tabela qrcode_session
        db.run(`
          CREATE TABLE IF NOT EXISTS qrcode_session (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_token TEXT UNIQUE NOT NULL,
            local_trabalho_id INTEGER,
            expires_at DATETIME NOT NULL,
            used BOOLEAN DEFAULT 0,
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

        // Admin padrão (senha: admin123)
        
        bcrypt.hash('admin123', 10, (err, senhaHash) => {
  if (err) {
    console.error('❌ Erro ao gerar hash:', err);
    reject(err);
    return;
  }
  
        db.run(`
          INSERT OR IGNORE INTO funcionario 
          (nome, email, senha_hash, cargo, data_contratacao, is_admin, is_gestor, gestor_id) 
          VALUES (?, ?, ?, ?, date('now'), 1, 0, NULL)
        `, ['Administrador', 'admin@prefeitura.gov.br', senhaHash, 'Administrador'], function(err) {
          if (err) {
            console.error('❌ Erro ao criar admin:', err);
            reject(err);
          } else {
            if (this.changes > 0) {
              console.log('✅ Admin criado com sucesso!');
            } else {
              console.log('✅ Admin já existe!');
            }
            console.log('✅ Todas as tabelas criadas com sucesso!');
            resolve();
          }
        });
      });
      });
    });
  });
};

// Para compatibilidade com o código existente
const pool = {
  get: () => ({
    connect: () => Promise.resolve({
      query: (sql, params = []) => {
        return new Promise((resolve, reject) => {
          if (sql.trim().toUpperCase().startsWith('SELECT')) {
            db.all(sql, params, (err, rows) => {
              if (err) reject(err);
              else resolve({ rows });
            });
          } else {
            db.run(sql, params, function(err) {
              if (err) reject(err);
              else resolve({ 
                rows: this.lastID ? [{ id: this.lastID }] : [],
                rowCount: this.changes
              });
            });
          }
        });
      },
      release: () => {}
    }),
    query: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        if (sql.trim().toUpperCase().startsWith('SELECT')) {
          db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve({ rows });
          });
        } else {
          db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ 
              rows: this.lastID ? [{ id: this.lastID }] : [],
              rowCount: this.changes
            });
          });
        }
      });
    },
    end: () => {
      if (db) {
        db.close();
      }
      return Promise.resolve();
    }
  })
};

module.exports = { pool, createTables };