const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

// Importe do NOVO setupDatabase.js (que só cria tabelas)
const { createTables } = require('./config/setupDatabase');
const routes = require('./routes/mainRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos da pasta 'public'
app.use(express.static('public'));

// Rota para página de confirmação (se quiser URL amigável)
app.get('/confirmar', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'confirmar.html'));
});

// Rota para terminal
app.get('/terminal', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'terminal.html'));
});

// Rotas
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Inicialização
const startServer = async () => {
  try {
    // 1. Criar tabelas (se não existirem)
    await createTables();
    
    // 2. Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📱 API disponível em: http://localhost:${PORT}/api`);
      console.log(`❤️  Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();