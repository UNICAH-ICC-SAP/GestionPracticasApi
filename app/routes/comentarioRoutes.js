'use strict';

const express = require('express');
const router = express.Router();
const comentarioController = require('../controllers/comentarioController');

router.post('/insert', comentarioController.create);
router.get('/findBy', comentarioController.getByReferencia);

module.exports = router;
