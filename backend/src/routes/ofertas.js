'use strict';
const express = require('express');
const router = express.Router();
const multer = require('multer');
const c = require('../controllers/ofertasController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/resumo', c.resumo);
router.get('/pivot/setores', c.pivotSetores);
router.get('/pivot/congregacoes', c.pivotCongregacoes);
router.get('/pivot/cidades', c.pivotCidades);
router.post('/upsert', c.upsert);
router.post('/importar-preview', upload.single('arquivo'), c.importarPreview);
router.post('/confirmar-importacao', c.confirmarImportacao);
router.get('/', c.list);
router.get('/:id', c.getById);
router.post('/', c.create);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

module.exports = router;
