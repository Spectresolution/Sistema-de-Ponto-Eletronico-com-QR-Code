const express = require('express');
const router = express.Router();
const { criarLocal, listarLocais } = require('../controllers/localController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

// Rotas para administradores
router.post('/', authMiddleware, adminMiddleware, criarLocal);
// Rotas para usuários autenticados
router.get('/', authMiddleware, listarLocais);

module.exports = router;