const router = require('express').Router();
const ctrl   = require('../controllers/missionarioController');
const upload = require('../config/multer');

router.get   ('/',    ctrl.listar);
router.get   ('/:id', ctrl.buscarPorId);
router.post  ('/',    upload.single('foto'), ctrl.criar);
router.put   ('/:id', upload.single('foto'), ctrl.atualizar);
router.delete('/:id', ctrl.remover);

module.exports = router;
