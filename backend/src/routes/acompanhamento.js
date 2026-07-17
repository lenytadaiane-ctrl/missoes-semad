'use strict';
const express = require('express');
const router = express.Router({ mergeParams: true }); // herda :missionarioId
const c = require('../controllers/acompanhamentoController');

router.get('/interacoes',           c.listarInteracoes);
router.post('/interacoes',          c.criarInteracao);
router.put('/interacoes/:id',       c.atualizarInteracao);
router.delete('/interacoes/:id',    c.deletarInteracao);

router.get('/campo',                c.getCampo);
router.put('/campo',                c.salvarCampo);

router.get('/relatorios',           c.listarRelatorios);
router.post('/relatorios',          c.criarRelatorio);
router.put('/relatorios/:id',       c.atualizarRelatorio);
router.delete('/relatorios/:id',    c.deletarRelatorio);

router.get('/marcos',               c.listarMarcos);
router.post('/marcos',              c.criarMarco);
router.delete('/marcos/:id',        c.deletarMarco);

router.get('/ajudas',               c.listarAjudas);
router.post('/ajudas',              c.criarAjuda);
router.delete('/ajudas/:id',        c.deletarAjuda);

router.get('/avaliacoes',           c.listarAvaliacoes);
router.post('/avaliacoes',          c.salvarAvaliacao);

module.exports = router;
