'use strict'

const express = require('express');
const fileController = require('../controllers/fileController');
const auth = require('../middlewares/auth')
const apiRoutes = express.Router();

apiRoutes.post('/uploadDocument', auth.isAuth, async (req, res) => await fileController.uploadDocument(req, res))
    .get('/dowloadDocument', auth.isAuth, async (req, res) => await fileController.downloadDocument(req, res))
    .get('/getFiles', auth.isAuth, async (req, res) => await fileController.getFiles(req, res))
// .post('/insert', auth.isAuth, async (req, res) => await facultadController.insert(req, res));

module.exports = apiRoutes;