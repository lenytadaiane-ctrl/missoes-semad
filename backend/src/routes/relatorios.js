'use strict';
const express = require('express');
const router = express.Router();
const { relatorioMissionarios, relatorioFinanceiro, relatorioFinanceiroSetores, relatorioFinanceiroCongregacoes } = require('../controllers/relatoriosController');

router.get('/missionarios', relatorioMissionarios);
router.get('/financeiro', relatorioFinanceiro);
router.get('/financeiro/setores', relatorioFinanceiroSetores);
router.get('/financeiro/congregacoes', relatorioFinanceiroCongregacoes);

module.exports = router;
