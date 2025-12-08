// src/controllers/localController.js - CORRIGIDO
const { pool } = require('../config/database');

const criarLocal = async (req, res) => {
  try {
    const { nome_local, endereco, latitude, longitude, raio_tolerancia_metros } = req.body;

    console.log('🏢 Criando local de trabalho:', nome_local);

    // Validações
    if (!nome_local || !latitude || !longitude) {
      return res.status(400).json({ 
        success: false,
        error: 'Nome, latitude e longitude são obrigatórios' 
      });
    }

    // CORREÇÃO: Use pool.query() direto
    const result = await pool.query(
      `INSERT INTO local_trabalho 
       (nome_local, endereco, latitude, longitude, raio_tolerancia_metros) 
       VALUES (?, ?, ?, ?, ?)
       RETURNING id, nome_local, endereco, latitude, longitude, raio_tolerancia_metros, ativo`,
      [
        nome_local,
        endereco || null,
        latitude,
        longitude,
        raio_tolerancia_metros || 100
      ]
    );

    console.log('✅ Local criado:', nome_local);

    res.status(201).json({
      success: true,
      message: 'Local de trabalho criado com sucesso',
      local: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Erro ao criar local:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor' 
    });
  }
};

const listarLocais = async (req, res) => {
  try {
    // CORREÇÃO: Use pool.query() direto
    const result = await pool.query(
      'SELECT id, nome_local, endereco, latitude, longitude, raio_tolerancia_metros, ativo FROM local_trabalho WHERE ativo = 1'
    );

    res.json({ 
      success: true,
      locais: result.rows 
    });
  } catch (error) {
    console.error('❌ Erro ao listar locais:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor' 
    });
  }
};

module.exports = { criarLocal, listarLocais };