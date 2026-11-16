'use strict'

const express = require('express');
const ternaController = require('../controllers/ternaController');
const auth = require('../middlewares/auth')
const { ternaScope } = require('../services/accessService');
const apiRoutes = express.Router();

apiRoutes.get('/getTernas', auth.isAuth, auth.scopeQuery(ternaScope), async (req, res) => await ternaController.findAll(req, res))
    .get('/getTernaBy', auth.isAuth, auth.scopeQuery(ternaScope), async (req, res) => await ternaController.findBy(req, res))
    .patch('/updateTerna', auth.isAuth, async (req, res) => await ternaController.updateTerna(req, res))
    .post('/insert', auth.isAuth, auth.requireAdmin, async (req, res) => await ternaController.insert(req, res));

module.exports = apiRoutes;