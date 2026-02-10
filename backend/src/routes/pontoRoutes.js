const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

const {
  marcarPonto,
  getPontosHoje,
  getHistorico,
  getTodosRegistros,
  registrarPontoWeb,
  loginWeb,
  verificarSessaoWeb
} = require('../controllers/pontoController');

const { authMiddleware, adminMiddleware } = require('../middlewares/auth');


// ================= ROTAS PÚBLICAS (Fluxo via QR Web) =================
router.post('/login-web', loginWeb);
router.post('/registrar-web', registrarPontoWeb);
router.post('/verificar-sessao', verificarSessaoWeb);


// ================= ROTAS PROTEGIDAS (App autenticado) =================
router.use(authMiddleware);

router.post('/marcar', marcarPonto);
router.get('/hoje', getPontosHoje);
router.get('/historico', getHistorico);
router.get('/todos', getTodosRegistros);


// ======================================================
// 🔒 ROTAS ADMINISTRATIVAS — GERENCIAMENTO DE REGISTROS
// ======================================================


// ➕ ADMIN — ADICIONAR REGISTRO MANUAL
router.post('/registro/manual', adminMiddleware, async (req, res) => {
  try {
    const { funcionario_id, timestamp, tipo } = req.body;

    if (!funcionario_id || !timestamp || !tipo) {
      return res.status(400).json({
        success: false,
        error: 'funcionario_id, timestamp e tipo são obrigatórios'
      });
    }

    await pool.query(
      `INSERT INTO registro_ponto (funcionario_id, timestamp_registro, tipo_registro)
       VALUES (?, ?, ?)`,
      [funcionario_id, timestamp, tipo]
    );

    res.json({ success: true, message: 'Registro inserido manualmente' });
  } catch (error) {
    console.error('❌ Erro ao inserir registro manual:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});


// ✏️ ADMIN — EDITAR DATA/HORA E TIPO
router.put('/registro/:id', adminMiddleware, async (req, res) => {
  try {
    const { novo_timestamp, novo_tipo } = req.body;

    if (!novo_timestamp || !novo_tipo) {
      return res.status(400).json({
        success: false,
        error: 'novo_timestamp e novo_tipo são obrigatórios'
      });
    }

    await pool.query(
      `UPDATE registro_ponto
       SET timestamp_registro = ?, tipo_registro = ?
       WHERE id = ?`,
      [novo_timestamp, novo_tipo, req.params.id]
    );

    res.json({ success: true, message: 'Registro atualizado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao atualizar registro:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});


// 🗑 ADMIN — EXCLUIR REGISTRO
router.delete('/registro/:id', adminMiddleware, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM registro_ponto WHERE id = ?',
      [req.params.id]
    );

    res.json({ success: true, message: 'Registro excluído com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao excluir registro:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});


module.exports = router;
