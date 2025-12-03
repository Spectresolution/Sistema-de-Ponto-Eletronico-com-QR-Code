const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');

// Middleware de debug PARA TODAS as rotas de auth
router.use((req, res, next) => {
  console.log('🔍 AUTH ROUTE - Body recebido:', req.body);
  console.log('🔍 AUTH ROUTE - Content-Type:', req.headers['content-type']);
  console.log('🔍 AUTH ROUTE - Método:', req.method);
  console.log('🔍 AUTH ROUTE - URL:', req.url);
  next();
});

// Rotas públicas de autenticação
router.post('/login', login);

module.exports = router;