'use strict'

const express = require('express');
const clasesDocentesController = require('../controllers/clasesDocenteController');
const auth = require('../middlewares/auth')
const apiRoutes = express.Router();

apiRoutes.get('/get', auth.isAuth, async (req, res) => await clasesDocentesController.findAll(req, res))

module.exports = apiRoutes;