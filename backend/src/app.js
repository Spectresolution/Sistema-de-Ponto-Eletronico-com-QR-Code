const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

const { createTables } = require('./config/setupDatabase');
const routes = require('./routes/mainRoutes');
const { getRequestHost } = require('./utils/requestHost');

const app = express();
app.set('trust proxy', true);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: true,            // reflete a origem automaticamente
  credentials: true,
}));


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Arquivos estáticos
app.use(express.static('public'));

// Rotas de páginas
app.get('/confirmar', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'confirmar.html'));
});

app.get('/terminal', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'terminal.html'));
});

// API
app.use('/api', routes);

// Health
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Start
const startServer = async () => {
  try {
  // 1. Criar tabelas (se não existirem)
    await createTables();
  // 2. Iniciar servidor
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📱 Acesse via IP da máquina (ex: http://192.168.x.x:${PORT}/terminal)`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();