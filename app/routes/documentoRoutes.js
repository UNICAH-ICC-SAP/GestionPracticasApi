'use strict'

const express = require('express');
const detalleDocumentacionController = require('../controllers/detalleDocumentacionController');
const auth = require('../middlewares/auth')
const apiRoutes = express.Router();

apiRoutes.get('/getDetalleDocumentacion', auth.isAuth, async (req, res) => await detalleDocumentacionController.findAll(req, res))
    .get('/getDetalleDocumentacionBy', auth.isAuth, async (req, res) => await detalleDocumentacionController.findBy(req, res))
    .post('/insert', auth.isAuth, async (req, res) => await detalleDocumentacionController.insert(req, res));

module.exports = apiRoutes;