'use strict'

const express = require('express');
const userPermissionController = require('../controllers/userPermissionController');
const auth = require('../middlewares/auth');

const apiRoutes = express.Router();

apiRoutes
    .get('/getUserPermissions', auth.isAuth, auth.requireAdmin, async (req, res) => await userPermissionController.findAll(req, res))
    .post('/getUserPermissionsByUser', auth.isAuth, auth.ownPermissions('userId'), async (req, res) => await userPermissionController.findPermissionsByUser(req, res))
    .post('/insertUserPermission', auth.isAuth, auth.requireAdmin, async (req, res) => await userPermissionController.insert(req, res))
    .put('/updateUserPermissionType', auth.isAuth, auth.requireAdmin, async (req, res) => await userPermissionController.updateType(req, res))
    .delete('/removeUserPermission', auth.isAuth, auth.requireAdmin, async (req, res) => await userPermissionController.remove(req, res));

module.exports = apiRoutes;