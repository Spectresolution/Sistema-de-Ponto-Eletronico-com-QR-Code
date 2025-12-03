const express = require('express');
const router = express.Router();
const { gerarQRCodeSession, validarQRCode, debugToken } = require('../controllers/qrcodeController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

// Gerar QR Code (somente admin)
router.post('/gerar', authMiddleware, adminMiddleware, gerarQRCodeSession);
// Validar QR Code (qualquer usuário autenticado)
router.post('/validar', authMiddleware, validarQRCode);
//Limpar tokens
router.get('/limpar-tokens', authMiddleware, debugToken);

module.exports = router;