const router = require('express').Router();
const ctrl   = require('../controllers/rankingController');

router.get('/congregacoes', ctrl.rankingCongregacoes);
router.get('/setores',      ctrl.rankingSetores);

module.exports = router;
