'use strict'

const express = require('express');
const documentacionController = require('../controllers/documentacionController');
const auth = require('../middlewares/auth')
const apiRoutes = express.Router();

apiRoutes.get('/getDocumentaciones', auth.isAuth, async (req, res) => await documentacionController.findAll(req, res))
    .get('/getDocumentacionesBy', auth.isAuth, async (req, res) => await documentacionController.findBy(req, res))
    .post('/insert', auth.isAuth, async (req, res) => await documentacionController.insert(req, res));

module.exports = apiRoutes;