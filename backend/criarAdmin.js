// ============================================
// criarAdmin.js (DEBUG)
// Cria ou atualiza usuário admin no SQLite
// MOSTRA SENHA E HASH (APENAS PARA DESENVOLVIMENTO)
// ============================================

const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// ===============================
// LOCAL DO BANCO
// ===============================
const dataDir = path.join(__dirname, 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
  console.log('📁 Pasta "data" criada');
}

const dbPath = path.join(dataDir, 'ponto_eletronico.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro ao abrir banco:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Banco SQLite:', dbPath);
  }
});

// ===============================
// DADOS DO ADMIN (ALTERE AQUI)
// ===============================
const adminData = {
  nome: 'Administrador',
  email: 'admin@email.com',
  senha: 'admin123', // 👈 SENHA EM TEXTO PURO (DEBUG)
  cpf: '000.000.001-00',
  cargo: 'Administrador'
};

// ===============================
// FUNÇÃO PRINCIPAL
// ===============================
async function criarOuAtualizarAdmin() {
  try {
    console.log('\n🔐 DADOS DO ADMIN');
    console.log('📧 Email:', adminData.email);
    console.log('🔑 Senha (texto puro):', adminData.senha);

    const hash = await bcrypt.hash(adminData.senha, 10);

    console.log('🧬 Hash gerada:', hash);

    // Verifica se o admin já existe
    db.get(
      'SELECT id FROM funcionario WHERE email = ?',
      [adminData.email],
      (err, row) => {
        if (err) {
          console.error('❌ Erro na consulta:', err.message);
          db.close();
          return;
        }

        if (row) {
          // ===============================
          // ATUALIZA ADMIN EXISTENTE
          // ===============================
          db.run(
            `UPDATE funcionario 
             SET senha_hash = ?, ativo = 1, is_admin = 1 
             WHERE id = ?`,
            [hash, row.id],
            function (err) {
              if (err) {
                console.error('❌ Erro ao atualizar admin:', err.message);
              } else {
                console.log(`✅ Admin atualizado (ID ${row.id})`);
              }
              listarFuncionarios();
            }
          );
        } else {
          // ===============================
          // CRIA NOVO ADMIN
          // ===============================
          db.run(
            `INSERT INTO funcionario 
             (nome, email, senha_hash, cpf, cargo, data_contratacao, ativo, is_admin)
             VALUES (?, ?, ?, ?, ?, date('now'), 1, 1)`,
            [
              adminData.nome,
              adminData.email,
              hash,
              adminData.cpf,
              adminData.cargo
            ],
            function (err) {
              if (err) {
                console.error('❌ Erro ao criar admin:', err.message);
              } else {
                console.log(`✅ Admin criado (ID ${this.lastID})`);
              }
              listarFuncionarios();
            }
          );
        }
      }
    );
  } catch (err) {
    console.error('❌ Erro geral:', err.message);
    db.close();
  }
}

// ===============================
// LISTAR FUNCIONÁRIOS
// ===============================
function listarFuncionarios() {
  db.all(
    'SELECT id, nome, email, ativo, is_admin FROM funcionario',
    (err, rows) => {
      if (err) {
        console.error('❌ Erro ao listar funcionários:', err.message);
      } else {
        console.log('\n📋 FUNCIONÁRIOS NO BANCO:');
        rows.forEach(r => {
          console.log(
            `- ID ${r.id} | ${r.nome} | ${r.email} | ativo=${r.ativo} | admin=${r.is_admin}`
          );
        });
      }
      db.close();
    }
  );
}

// ===============================
// EXECUÇÃO
// ===============================
criarOuAtualizarAdmin();
