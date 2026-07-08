'use strict'

const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');

router.get('/resumen', reportesController.getResumen);

module.exports = router;
