'use strict'

const express = require('express');
const seccionesController = require('../controllers/seccionesController');
const auth = require('../middlewares/auth')
const apiRoutes = express.Router();

apiRoutes.get('/getSections', auth.isAuth, async (req, res) => await seccionesController.get(req, res))
        .post('/insertSection', auth.isAuth, async (req, res) => await seccionesController.insert(req, res))
        .put('/updateSection', auth.isAuth, async (req, res) => await seccionesController.update(req, res))
        .delete('/deleteSection', auth.isAuth, async (req, res) => await seccionesController.deleteSection(req, res));

module.exports = apiRoutes;