'use strict'

const express = require('express');
const alumnoController = require('../controllers/alumnoController');
const auth = require('../middlewares/auth')
const apiRoutes = express.Router();

apiRoutes.get('/getAlumnos', auth.isAuth, async (req, res) => await alumnoController.findAll(req, res))
    .get('/getAlumnosBy', auth.isAuth, async (req, res) => await alumnoController.findBy(req, res))
    .get('/getAllData', auth.isAuth, async (req, res) => await alumnoController.findAllData(req, res))
    .post('/insert', auth.isAuth, async (req, res) => await alumnoController.insert(req, res));

module.exports = apiRoutes;
