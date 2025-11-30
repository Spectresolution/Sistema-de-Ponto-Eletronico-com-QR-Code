const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ponto_eletronico',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Criar tabelas automaticamente
const createTables = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS funcionario (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        senha_hash CHAR(60) NOT NULL,
        cpf VARCHAR(14) UNIQUE,
        cargo VARCHAR(100) NOT NULL,
        departamento VARCHAR(100),
        jornada_padrao_horas NUMERIC(4, 2) DEFAULT 8.00,
        data_contratacao DATE NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        is_gestor BOOLEAN DEFAULT FALSE,
        gestor_id INTEGER REFERENCES funcionario(id),
        ativo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS local_trabalho (
        id SERIAL PRIMARY KEY,
        nome_local VARCHAR(255) NOT NULL,
        endereco TEXT,
        latitude NUMERIC(10, 8) NOT NULL,
        longitude NUMERIC(11, 8) NOT NULL,
        raio_tolerancia_metros INTEGER DEFAULT 100,
        horario_funcionamento_inicio TIME,
        horario_funcionamento_fim TIME,
        ativo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS qrcode_session (
        id SERIAL PRIMARY KEY,
        session_token VARCHAR(128) UNIQUE NOT NULL,
        local_trabalho_id INTEGER REFERENCES local_trabalho(id),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS registro_ponto (
        id BIGSERIAL PRIMARY KEY,
        funcionario_id INTEGER REFERENCES funcionario(id) NOT NULL,
        timestamp_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        tipo_registro VARCHAR(50) NOT NULL CHECK (tipo_registro IN (
          'ENTRADA', 'SAIDA', 'INICIO_INTERVALO', 'FIM_INTERVALO'
        )),
        latitude_marcada NUMERIC(10, 8),
        longitude_marcada NUMERIC(11, 8),
        local_validado_id INTEGER REFERENCES local_trabalho(id),
        qrcode_session_id INTEGER REFERENCES qrcode_session(id),
        caminho_foto VARCHAR(255),
        endereco_aproximado VARCHAR(500),
        precisao_gps NUMERIC(5, 2),
        dispositivo_info JSONB,
        ajustado BOOLEAN DEFAULT FALSE,
        observacoes TEXT
      );

      CREATE TABLE IF NOT EXISTS solicitacao_ajuste (
        id SERIAL PRIMARY KEY,
        funcionario_id INTEGER REFERENCES funcionario(id) NOT NULL,
        registro_ponto_id INTEGER REFERENCES registro_ponto(id),
        data_alvo DATE NOT NULL,
        hora_solicitada TIME,
        tipo_ajuste VARCHAR(50) NOT NULL CHECK (tipo_ajuste IN (
          'FALTA_MARCACAO', 'CORRECAO_HORA', 'AJUSTE_INTERVALO'
        )),
        justificativa TEXT NOT NULL,
        evidencias JSONB,
        status VARCHAR(50) DEFAULT 'PENDENTE' CHECK (status IN (
          'PENDENTE', 'APROVADO', 'REJEITADO', 'CANCELADO'
        )),
        admin_id_aprovador INTEGER REFERENCES funcionario(id),
        data_solicitacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        data_analise TIMESTAMP WITH TIME ZONE,
        feedback_gestor TEXT
      );

      -- Inserir admin padrão
      INSERT INTO funcionario (nome, email, senha_hash, cargo, data_contratacao, is_admin, is_gestor) 
      VALUES (
        'Administrador', 
        'admin@prefeitura.gov.br', 
        '$2a$10$8K1p/a0dRTlB0Z6F2R8z5.YR3OYDfYYrO6cA6o9o5p5p5p5p5p5p5', 
        'Administrador do Sistema', 
        CURRENT_DATE, 
        true, 
        true
      ) ON CONFLICT (email) DO NOTHING;
    `);
    console.log('✅ Tabelas criadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
  } finally {
    client.release();
  }
};

module.exports = { pool, createTables };