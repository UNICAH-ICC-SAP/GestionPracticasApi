'use strict'

const express = require('express');
const docenteController = require('../controllers/docenteController');
const auth = require('../middlewares/auth')
const apiRoutes = express.Router();

apiRoutes.get('/getDocentes', auth.isAuth, async (req, res) => await docenteController.findAll(req, res))
    .get('/getDocentesBy', auth.isAuth, async (req, res) => await docenteController.findBy(req, res))
    .post('/insert', auth.isAuth, async (req, res) => await docenteController.insert(req, res))
    .get('/getAllDocentesBy', auth.isAuth, async (req, res) => await docenteController.findAllBy(req, res));

module.exports = apiRoutes;
