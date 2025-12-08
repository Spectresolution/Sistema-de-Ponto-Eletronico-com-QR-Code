const express = require('express');
const router = express.Router();
const { 
  marcarPonto, 
  getPontosHoje, 
  getHistorico, 
  getTodosRegistros,
  registrarPontoWeb,
  loginWeb,
  verificarSessaoWeb
} = require('../controllers/pontoController');
const { authMiddleware } = require('../middlewares/auth');

// ========== ROTAS PÚBLICAS (para página web) ==========
router.post('/login-web', loginWeb);
router.post('/registrar-web', registrarPontoWeb);
router.post('/verificar-sessao', verificarSessaoWeb);

// ========== ROTAS PROTEGIDAS (app com JWT) ==========
router.use(authMiddleware); // Todas as rotas abaixo exigem autenticação
router.post('/marcar', marcarPonto);
router.get('/hoje', getPontosHoje);
router.get('/historico', getHistorico);
router.get('/todos', getTodosRegistros);

module.exports = router;