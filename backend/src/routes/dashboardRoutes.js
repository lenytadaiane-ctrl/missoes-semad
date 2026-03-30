const router = require('express').Router();
const ctrl   = require('../controllers/dashboardController');

router.get('/graficos',      ctrl.getDashboardGraficos);
router.get('/entrada-anual', ctrl.getEntradaAnual);
router.get('/',              ctrl.getDashboard);

module.exports = router;
