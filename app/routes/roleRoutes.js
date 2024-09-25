'use strict'

const express = require('express');
const roleController = require('../controllers/roleController');
const auth = require('../middlewares/auth')
const apiRoutes = express.Router();

apiRoutes.get('/getRoles', auth.isAuth, async (req, res) => await roleController.findAll(req, res))
    .get('/getRolesBy', auth.isAuth, async (req, res) => await roleController.findBy(req, res));

module.exports = apiRoutes;