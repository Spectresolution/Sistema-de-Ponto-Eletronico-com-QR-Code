const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../ponto_eletronico.db');

// Conexão
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro SQLite:', err.message);
  } else {
    console.log('✅ SQLite conectado: ', dbPath);
    db.run('PRAGMA foreign_keys = ON');
  }
});

// Função query
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    console.log('📝 SQL:', sql.substring(0, 150) + (sql.length > 150 ? '...' : ''));
    console.log('📌 Parâmetros:', params);
    
    // DETECTAR se é SELECT ou tem RETURNING
    const sqlUpper = sql.trim().toUpperCase();
    const isSelect = sqlUpper.startsWith('SELECT');
    const hasReturning = sqlUpper.includes('RETURNING');
    
    console.log(`🔍 Tipo: ${isSelect ? 'SELECT' : 'NÃO-SELECT'} ${hasReturning ? 'com RETURNING' : ''}`);
    
    // Se for SELECT ou tiver RETURNING, usar db.all()
    if (isSelect || hasReturning) {
      db.all(sql, params, (err, rows) => {
        if (err) { 
          console.error('❌ Erro SQLite:', err.message);
          reject(err);
        } else {
          console.log(`📊 ${rows.length} linha(s) retornada(s)`);
          
          // DEBUG: Mostrar dados retornados
          if (rows.length > 0 && hasReturning) {
            console.log('🎯 Dados do RETURNING:', JSON.stringify(rows[0]));
          }
          
          resolve({ 
            rows,
            rowCount: rows.length,
            lastID: rows.length > 0 ? rows[0].id : undefined
          });
        }
      });
    } 
    // Se for INSERT/UPDATE/DELETE SEM RETURNING, usar db.run()
    else {
      db.run(sql, params, function(err) {
        if (err) { 
          console.error('❌ Erro SQLite:', err.message);
          reject(err);
        } else { 
          console.log(`📝 ${this.changes} linha(s) afetada(s), lastID: ${this.lastID}`);
          
          resolve({ 
            rows: this.lastID ? [{ id: this.lastID }] : [],
            rowCount: this.changes,
            lastID: this.lastID
          });
        }
      });
    }
  });
};

// Pool para compatibilidade
const pool = {
  query,
  getConnection: () => Promise.resolve({ query, release: () => {} })
};

module.exports = { pool, query, db };