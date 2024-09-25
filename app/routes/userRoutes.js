'use strict'

const express = require('express');
const usuarioController = require('../controllers/userController');
const auth = require('../middlewares/auth')
const apiRoutes = express.Router();

apiRoutes.post('/signUp', async (req, res) => await usuarioController.signUp(req, res))
    .post('/login', async (req, res) => await usuarioController.signIn(req, res))
    .get('/whoAmI', auth.whoAmI, async (req, res) => await usuarioController.getUserInfo(req, res));

module.exports = apiRoutes;