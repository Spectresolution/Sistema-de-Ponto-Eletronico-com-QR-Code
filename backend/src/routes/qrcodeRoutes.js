const express = require('express');
const router = express.Router();
const { 
  gerarQRCodeSession, 
  validarQRCode, 
  debugToken,
  gerarQRCodePublico,      // NOVO
  getQRCodeInfo,           // NOVO
  verificarDisponibilidadeQRCode // NOVO
} = require('../controllers/qrcodeController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

// ========== ROTAS PÚBLICAS (para terminal coletivo e página web) ==========
router.post('/gerar-publico', gerarQRCodePublico); // Terminal gera QR Code
router.get('/info', getQRCodeInfo);                // Página web obtém info
router.post('/verificar', verificarDisponibilidadeQRCode); // Verifica se pode usar

// ========== ROTAS PROTEGIDAS (para admin/app) ==========
router.post('/gerar', authMiddleware, adminMiddleware, gerarQRCodeSession); // Admin gera
router.post('/validar', authMiddleware, validarQRCode); // App valida
router.get('/limpar-tokens', authMiddleware, debugToken); // Debug

module.exports = router;