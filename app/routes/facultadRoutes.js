'use strict'

const express = require('express');
const facultadController = require('../controllers/facultadController');
const auth = require('../middlewares/auth')
const apiRoutes = express.Router();

apiRoutes.get('/getFacultades', auth.isAuth, async (req, res) => await facultadController.findAll(req, res))
    .get('/getFacultadesBy', auth.isAuth, async (req, res) => await facultadController.findBy(req, res))
    .post('/insert', auth.isAuth, async (req, res) => await facultadController.insert(req, res));

module.exports = apiRoutes;