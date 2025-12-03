const express = require('express');
const router = express.Router();

// Importar todas as rotas
const authRoutes = require('./authRoutes');
const funcionarioRoutes = require('./funcionarioRoutes');
const pontoRoutes = require('./pontoRoutes');
const localRoutes = require('./localRoutes');
const qrcodeRoutes = require('./qrcodeRoutes');

// Montar rotas com prefixo /api
router.use('/auth', authRoutes);
router.use('/funcionarios', funcionarioRoutes);
router.use('/ponto', pontoRoutes);
router.use('/locais', localRoutes);
router.use('/qrcode', qrcodeRoutes);

module.exports = router;