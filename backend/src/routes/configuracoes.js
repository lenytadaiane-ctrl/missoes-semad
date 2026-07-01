'use strict';
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/configuracoesController');

// Listas personalizadas
router.get('/listas', ctrl.getListas);
router.get('/listas/:chave', ctrl.getLista);
router.put('/listas/:chave', ctrl.salvarLista);
router.delete('/listas/:chave', ctrl.resetarLista);

// Entrada Anual
router.get('/entrada-anual', ctrl.listarEntradas);
router.post('/entrada-anual', ctrl.salvarEntrada);
router.delete('/entrada-anual/:id', ctrl.deletarEntrada);

module.exports = router;
