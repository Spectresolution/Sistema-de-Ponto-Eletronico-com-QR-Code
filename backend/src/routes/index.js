const express = require('express');
const router = express.Router();

// Controllers
const { login, criarFuncionario } = require('../controllers/authController');
const { marcarPonto, getPontosHoje, getHistorico } = require('../controllers/pontoController');
const { gerarQRCodeSession, validarQRCode } = require('../controllers/qrcodeController');

// Middleware
const { authMiddleware, adminMiddleware, gestorMiddleware } = require('../middleware/auth');

// Rotas públicas
router.post('/auth/login', login);

// Rotas autenticadas
router.post('/ponto/marcar', authMiddleware, marcarPonto);
router.get('/ponto/hoje', authMiddleware, getPontosHoje);
router.get('/ponto/historico', authMiddleware, getHistorico);

// Rotas admin
router.post('/qrcode/gerar', authMiddleware, adminMiddleware, gerarQRCodeSession);
router.post('/qrcode/validar', authMiddleware, validarQRCode);
router.post('/funcionarios', authMiddleware, adminMiddleware, criarFuncionario);

module.exports = router;