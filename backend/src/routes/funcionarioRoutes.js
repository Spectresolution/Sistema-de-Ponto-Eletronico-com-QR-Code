// funcionarioRoutes.js
const express = require('express');
const router = express.Router();
const funcionarioController = require('../controllers/funcionarioController');
const { authMiddleware, adminMiddleware, gestorMiddleware } = require('../middlewares/auth');

// ROTAS QUE GESTORES TAMBÉM PODEM ACESSAR
router.get('/', authMiddleware, gestorMiddleware, funcionarioController.listarFuncionarios);
router.get('/:id', authMiddleware, gestorMiddleware, funcionarioController.buscarFuncionario);

// ROTAS APENAS PARA ADMINS (desenvolvedor)
router.post('/', authMiddleware, adminMiddleware, funcionarioController.criarFuncionario);
router.put('/:id', authMiddleware, adminMiddleware, funcionarioController.atualizarFuncionario);
router.patch('/:id/status', authMiddleware, adminMiddleware, funcionarioController.toggleStatusFuncionario);

// ROTA EXTRA: tornar alguém gestor (apenas admin)
//provisório, depois é bom ter um controller par isso
router.post('/:id/tornar-gestor', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { pool } = require('../config/database');
    
    const result = await pool.query(
      'UPDATE funcionario SET is_gestor = 1 WHERE id = ? RETURNING id, nome, email, is_gestor',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Funcionário não encontrado' });
    }
    
    res.json({
      success: true,
      message: 'Funcionário promovido a gestor',
      funcionario: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erro ao promover a gestor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;