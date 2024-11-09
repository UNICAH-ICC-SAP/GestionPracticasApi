'use strict'

const express = require('express');
const pensumController = require('../controllers/pensumController');
const auth = require('../middlewares/auth')
const apiRoutes = express.Router();

apiRoutes.get('/getPensum', auth.isAuth, async (req, res) => await pensumController.get(req, res))
    .post('/insert', auth.isAuth, async (req, res) => await pensumController.insert(req, res))
    .put('/update', auth.isAuth, async (req, res) => await pensumController.update(req, res))
    .put('/updateStatus', auth.isAuth, async (req, res) => await pensumController.updateStatus(req, res))
    .get('/getPensumBy', auth.isAuth, async (req, res) => await pensumController.getClassBy(req, res));

module.exports = apiRoutes;