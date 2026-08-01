'use strict'

const express = require('express');
const horarioController = require('../controllers/horarioDisponibilidadController');
const auth = require('../middlewares/auth');
const apiRoutes = express.Router();

apiRoutes.get('/get', auth.isAuth, async (req, res) => await horarioController.get(req, res))
    .post('/upsert', auth.isAuth, async (req, res) => await horarioController.upsert(req, res))
    .delete('/delete', auth.isAuth, async (req, res) => await horarioController.deleteAll(req, res));

module.exports = apiRoutes;
