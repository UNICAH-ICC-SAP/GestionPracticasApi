'use strict'

const express = require('express');
const docenteController = require('../controllers/docenteController');
const auth = require('../middlewares/auth')
const apiRoutes = express.Router();

apiRoutes.get('/getDocentes', auth.isAuth, async (req, res) => await docenteController.findAll(req, res))
    .get('/getDocentesBy', auth.isAuth, async (req, res) => await docenteController.findBy(req, res))
    .post('/insert', auth.isAuth, async (req, res) => await docenteController.insert(req, res))
    .put('/update', auth.isAuth, async (req, res) => await docenteController.update(req, res))
    .put('/updateStatus', auth.isAuth, async (req, res) => await docenteController.updateStatus(req, res));

module.exports = apiRoutes;