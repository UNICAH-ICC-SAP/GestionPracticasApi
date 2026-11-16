'use strict'

const express = require('express');
const alumnoController = require('../controllers/alumnoController');
const auth = require('../middlewares/auth')
const { studentScope } = require('../services/accessService');
const apiRoutes = express.Router();

apiRoutes.get('/getAlumnos', auth.isAuth, auth.scopeQuery(studentScope), async (req, res) => await alumnoController.findAll(req, res))
    .get('/getAlumnosBy', auth.isAuth, auth.scopeQuery(studentScope), async (req, res) => await alumnoController.findBy(req, res))
    .get('/getAllData', auth.isAuth, auth.scopeQuery(studentScope), async (req, res) => await alumnoController.findAllData(req, res))
    .post('/insert', auth.isAuth, auth.requireAdmin, async (req, res) => await alumnoController.insert(req, res))
    .put('/update', auth.isAuth, auth.requireAdmin, async (req, res) => await alumnoController.update(req, res))
    .put('/updateStatus', auth.isAuth, auth.requireAdmin, async (req, res) => await alumnoController.updateStatus(req, res));

module.exports=apiRoutes;