const express = require('express');

const colaboradoresController = require('../controllers/colaboradores.controller');
const validacaoMiddleware = require('../middlewares/validacao.middleware');

const router = express.Router();

router.post(
  '/',
  validacaoMiddleware.validarCadastroColaborador,
  colaboradoresController.cadastrar
);

router.get('/', colaboradoresController.listar);

router.get('/:id', colaboradoresController.buscarPorId);

router.put(
  '/:id',
  validacaoMiddleware.validarAtualizacaoColaborador,
  colaboradoresController.atualizar
);

// Soft delete
router.delete('/:id', colaboradoresController.softDelete);

module.exports = router;

