'use strict';
const express = require('express');
const router = express.Router();
const c = require('../controllers/congregacoesController');

router.get('/', c.list);
router.get('/:id', c.getById);
router.post('/', c.create);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

module.exports = router;
