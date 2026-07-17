'use strict';
const express = require('express');
const router = express.Router();
const c = require('../controllers/ofertasController');

router.get('/resumo', c.resumo);
router.get('/pivot/setores', c.pivotSetores);
router.get('/pivot/congregacoes', c.pivotCongregacoes);
router.post('/upsert', c.upsert);
router.get('/', c.list);
router.get('/:id', c.getById);
router.post('/', c.create);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

module.exports = router;
