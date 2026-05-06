// app/routes/file.routes.js
'use strict';

const apiRoutes = require('express').Router();
const fileController = require('../controllers/fileController');
const auth = require('../middlewares/auth')

apiRoutes
    .post('/signed-urls', auth.isAuth, async (req, res) => await fileController.createSignedUrlUser(req, res))
    .post('/download-url', auth.isAuth, async (req, res) => await fileController.getDownloadUrl(req, res))
    .post('/update-signed-urls', auth.isAuth, async (req, res) => await fileController.updateCreateSignedUrlUser(req, res))
    .patch('/updateFileStatus', auth.isAuth, async (req, res) => await fileController.updateFileStatus(req, res))
    .post('/list', auth.isAuth, async (req, res) => await fileController.findAllByUser(req, res));

module.exports = apiRoutes;