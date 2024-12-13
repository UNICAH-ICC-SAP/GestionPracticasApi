'use strict'

const express = require('express');
const periodoController = require('../controllers/periodoController');
const auth = require('../middlewares/auth')
const apiRoutes = express.Router();

apiRoutes.post('/insert', auth.isAuth, async (req, res) => await periodoController.insert(req, res))
        .get('/get', auth.isAuth, async (req, res) => await periodoController.get(req, res));

module.exports = apiRoutes;