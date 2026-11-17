'use strict'

const express = require('express');
const rolePermissionController = require('../controllers/rolePermissionsController');
const auth = require('../middlewares/auth');

const apiRoutes = express.Router();

apiRoutes
    .get('/getRolePermissions', auth.isAuth, auth.requireAdmin, async (req, res) => await rolePermissionController.findAll(req, res))
    .post('/getRolesGrouped', auth.isAuth, auth.ownPermissions('roleId'), async (req, res) => await rolePermissionController.findRolesWithPermissions(req, res))
    .get('/getRolePermissionsByRole', auth.isAuth, auth.ownPermissions('roleId'), async (req, res) => await rolePermissionController.findByRole(req, res))
    .post('/insertRolePermission', auth.isAuth, auth.requireAdmin, async (req, res) => await rolePermissionController.insert(req, res))
    .delete('/removeRolePermission', auth.isAuth, auth.requireAdmin, async (req, res) => await rolePermissionController.remove(req, res));

module.exports = apiRoutes;