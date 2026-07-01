'use strict';
const express = require('express');
const router = express.Router();
const { rankingSetores, rankingCongregacoes } = require('../controllers/rankingController');

router.get('/setores', rankingSetores);
router.get('/congregacoes', rankingCongregacoes);

module.exports = router;
