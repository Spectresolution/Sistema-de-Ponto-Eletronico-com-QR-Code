const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../ponto_eletronico.db');

// Conexão
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro SQLite:', err.message);
  } else {
    console.log('✅ SQLite conectado');
    db.run('PRAGMA foreign_keys = ON');
  }
});

// Função query
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    console.log('📝 SQL:', sql.substring(0, 100) + '...');
    
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
};

// Pool para compatibilidade
const pool = {
  get: () => ({
    connect: () => Promise.resolve({ query, release: () => {} }),
    query
  }),
  query,
  end: () => Promise.resolve(db.close())
};

module.exports = { pool, query, db };