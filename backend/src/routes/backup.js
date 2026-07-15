'use strict';
const express = require('express');
const router = express.Router();
const { exportarBackup } = require('../controllers/backupController');

router.get('/export', exportarBackup);

module.exports = router;
