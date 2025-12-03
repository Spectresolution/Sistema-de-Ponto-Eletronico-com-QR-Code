const { pool } = require('../config/database');

const criarLocal = async (req, res) => {
  try {
    const { nome_local, endereco, latitude, longitude, raio_tolerancia_metros } = req.body;

    const result = await pool.get().query(
      `INSERT INTO local_trabalho 
       (nome_local, endereco, latitude, longitude, raio_tolerancia_metros) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, nome_local, latitude, longitude, raio_tolerancia_metros`,
      [nome_local, endereco || null, latitude, longitude, raio_tolerancia_metros || 100]
    );

    res.status(201).json({
      message: 'Local de trabalho criado com sucesso',
      local: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao criar local:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const listarLocais = async (req, res) => {
  try {
    const result = await pool.get().query(
      'SELECT id, nome_local, latitude, longitude, raio_tolerancia_metros, ativo FROM local_trabalho WHERE ativo = true'
    );

    res.json({ locais: result.rows });
  } catch (error) {
    console.error('Erro ao listar locais:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = { criarLocal, listarLocais };