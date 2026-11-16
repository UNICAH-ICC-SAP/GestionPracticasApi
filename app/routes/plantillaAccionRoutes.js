'use strict'

const express = require('express');
const plantillaAccionController = require('../controllers/plantillaAccionController');
const auth = require('../middlewares/auth')
const apiRoutes = express.Router();

apiRoutes.get('/getAlumnos', auth.isAuth, auth.requirePermission('CONFIG_EMAIL_TEMPLATE'), async (req, res) => await plantillaAccionController.findAll(req, res))
    .get('/getAlumnosBy', auth.isAuth, auth.requirePermission('CONFIG_EMAIL_TEMPLATE'), async (req, res) => await plantillaAccionController.findBy(req, res))
    .get('/getAllData', auth.isAuth, auth.requirePermission('CONFIG_EMAIL_TEMPLATE'), async (req, res) => await plantillaAccionController.findAll(req, res))
    .post('/insert', auth.isAuth, auth.requirePermission('CONFIG_EMAIL_TEMPLATE'), async (req, res) => await plantillaAccionController.insert(req, res))
    .put('/update', auth.isAuth, auth.requirePermission('CONFIG_EMAIL_TEMPLATE'), async (req, res) => await plantillaAccionController.update(req, res))
    .put('/updateStatus', auth.isAuth, auth.requirePermission('CONFIG_EMAIL_TEMPLATE'), async (req, res) => await plantillaAccionController.updateStatus(req, res));

module.exports = apiRoutes;