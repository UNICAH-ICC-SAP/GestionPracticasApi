'use strict'

const express = require('express');
const docenteController = require('../controllers/docenteController');
const auth = require('../middlewares/auth')
const { teacherScope } = require('../services/accessService');
const apiRoutes = express.Router();

apiRoutes.get('/getDocentes', auth.isAuth, auth.scopeQuery(teacherScope), async (req, res) => await docenteController.findAll(req, res))
    .get('/getDocentesBy', auth.isAuth, auth.scopeQuery(teacherScope), async (req, res) => await docenteController.findBy(req, res))
    .post('/insert', auth.isAuth, auth.requireAdmin, async (req, res) => await docenteController.insert(req, res))
    .put('/update', auth.isAuth, auth.requireAdmin, async (req, res) => await docenteController.update(req, res))
    .put('/updateStatus', auth.isAuth, auth.requireAdmin, async (req, res) => await docenteController.updateStatus(req, res));

module.exports = apiRoutes;