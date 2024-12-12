'use strict'

const express = require('express');
const seccionesController = require('../controllers/seccionesController');
const auth = require('../middlewares/auth')
const apiRoutes = express.Router();

apiRoutes.post('/insertSection', auth.isAuth, async (req, res) => await seccionesController.insert(req, res));

module.exports = apiRoutes;