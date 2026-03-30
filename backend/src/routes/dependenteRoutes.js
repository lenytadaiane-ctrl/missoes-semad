const router = require('express').Router();
const ctrl   = require('../controllers/dependenteController');

router.post  ('/',    ctrl.criar);
router.put   ('/:id', ctrl.atualizar);
router.delete('/:id', ctrl.remover);

module.exports = router;
