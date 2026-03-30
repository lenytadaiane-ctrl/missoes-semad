const router = require('express').Router();
const ctrl   = require('../controllers/relatorioController');

// PDF deve vir antes do JSON para não conflitar a rota
router.get('/missionarios/pdf',        ctrl.getMissionariosPDF);
router.get('/missionarios',            ctrl.getMissionarios);

router.get('/bases-missionarias/pdf',  ctrl.getBasesPDF);
router.get('/bases-missionarias',      ctrl.getBases);

router.get('/promotores/pdf',          ctrl.getPromotoresPDF);
router.get('/promotores',              ctrl.getPromotores);

router.get('/secretarios/pdf',         ctrl.getSecretariosPDF);
router.get('/secretarios',             ctrl.getSecretarios);

router.get('/financeiro/pdf',          ctrl.getFinanceiroPDF);
router.get('/financeiro',              ctrl.getFinanceiro);

module.exports = router;
