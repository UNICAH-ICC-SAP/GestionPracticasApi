'use strict';

const express = require('express');
const auth = require('../middlewares/auth');
const controller = require('../controllers/cargaImportController');
const router = express.Router();

router.use(auth.isAuth, auth.requireAdmin);
router.post('/preview', controller.preview);
router.post('/confirm', controller.confirm);
router.post('/excel', controller.excel);

module.exports = router;
