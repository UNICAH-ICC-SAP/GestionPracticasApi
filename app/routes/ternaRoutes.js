'use strict'

const express = require('express');
const ternaController = require('../controllers/ternaController');
const auth = require('../middlewares/auth')
const apiRoutes = express.Router();

apiRoutes.get('/getTernas', auth.isAuth, async (req, res) => await ternaController.findAll(req, res))
    .get('/getTernaBy', auth.isAuth, async (req, res) => await ternaController.findBy(req, res))
    .post('/insert', auth.isAuth, async (req, res) => await ternaController.insert(req, res));

module.exports = apiRoutes;