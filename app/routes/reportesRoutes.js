'use strict'

const express = require('express');
const reportesController = require('../controllers/reportesController');
const auth = require('../middlewares/auth')
const apiRoutes = express.Router();

apiRoutes.get('/docentes', auth.isAuth, async (req, res) => await reportesController.generarReporteDocentes(req, res))
    .get('/ternas', auth.isAuth, async (req, res) => await reportesController.generarReporteTernas(req, res))
    .get('/clases', auth.isAuth, async (req, res) => await reportesController.generarReporteClases(req, res));

module.exports = apiRoutes;
