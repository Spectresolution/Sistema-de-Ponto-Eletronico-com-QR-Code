const express = require('express');
const router = express.Router();
const funcionarioController = require('../controllers/funcionarioController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

// Todas as rotas exigem autenticação e permissão de admin
router.use(authMiddleware, adminMiddleware);

// CRUD de funcionários
router.get('/', funcionarioController.listarFuncionarios);
router.post('/', funcionarioController.criarFuncionario);
router.get('/:id', funcionarioController.buscarFuncionario);
router.put('/:id', funcionarioController.atualizarFuncionario);
router.patch('/:id/status', funcionarioController.toggleStatusFuncionario);

module.exports = router;