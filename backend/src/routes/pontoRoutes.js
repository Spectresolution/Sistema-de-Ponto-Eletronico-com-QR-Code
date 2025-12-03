const express = require('express');
const router = express.Router();
const { marcarPonto, getPontosHoje, getHistorico, getTodosRegistros } = require('../controllers/pontoController');
const { authMiddleware } = require('../middlewares/auth');

// Todas as rotas exigem autenticação
router.use(authMiddleware);

// Rotas de ponto
router.post('/marcar', marcarPonto);
router.get('/hoje', getPontosHoje);
router.get('/historico', getHistorico);

//apenas admin
router.get('/todos', getTodosRegistros);

module.exports = router;