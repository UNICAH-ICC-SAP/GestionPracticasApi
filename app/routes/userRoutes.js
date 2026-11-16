'use strict'

const express = require('express');
const usuarioController = require('../controllers/userController');
const registrationController = require('../controllers/accountRegistrationController');
const auth = require('../middlewares/auth')
const apiRoutes = express.Router();

apiRoutes.post('/signUp', auth.isAuth, auth.requireAdmin, async (req, res) => await usuarioController.signUp(req, res))
    .post('/register', auth.isAuth, auth.requireAdmin, async (req, res) => await registrationController.register(req, res))
    .post('/invitation', auth.isAuth, auth.requireAdmin, async (req, res) => await usuarioController.renewInvitation(req, res))
    .post('/login', async (req, res) => await usuarioController.signIn(req, res))
    .get('/whoAmI', auth.whoAmI, async (req, res) => await usuarioController.getUserInfo(req, res))
    .post('/activate', async (req, res) => await usuarioController.activateAccount(req, res))
    .put('/resetPassword', auth.whoAmI, async (req, res) => await usuarioController.resetPassword(req, res));

module.exports = apiRoutes;
