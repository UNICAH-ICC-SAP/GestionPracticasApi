'use strict'

const express = require('express');
const detalleTernaController = require('../controllers/detalleTernaController');
const auth = require('../middlewares/auth')
const apiRoutes = express.Router();

apiRoutes.get('/getDetalleTernas', auth.isAuth, async (req, res) => await detalleTernaController.findAll(req, res))
    .get('/getDetalleTernasBy', auth.isAuth, async (req, res) => await detalleTernaController.findBy(req, res))
    .post('/insert', auth.isAuth, async (req, res) => await detalleTernaController.insert(req, res));

module.exports = apiRoutes;