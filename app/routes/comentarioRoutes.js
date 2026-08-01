'use strict';

const express = require('express');
const router = express.Router();
const comentarioController = require('../controllers/comentarioController');

router.post('/create', comentarioController.create);
router.get('/getByReferencia', comentarioController.getByReferencia);

module.exports = router;
