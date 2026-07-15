'use strict';
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

router.use('/auth', require('./auth'));

router.use(authMiddleware);

router.use('/dashboard', require('./dashboard'));
router.use('/setores', require('./setores'));
router.use('/congregacoes', require('./congregacoes'));
router.use('/bases-missionarias', require('./basesMissionarias'));
router.use('/missionarios', require('./missionarios'));
router.use('/dependentes', require('./dependentes'));
router.use('/promotores-missoes', require('./promotores'));
router.use('/agentes-missoes', require('./agentes'));
router.use('/secretarios-missoes', require('./secretarios'));
router.use('/ofertas-missionarias', require('./ofertas'));
router.use('/ranking', require('./ranking'));
router.use('/relatorios', require('./relatorios'));
router.use('/configuracoes', require('./configuracoes'));
router.use('/backup', require('./backup'));

module.exports = router;
