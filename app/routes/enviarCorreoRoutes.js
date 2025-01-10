'use strict';

const express = require('express');
const correoController = require('../controllers/enviarCorreoController');
const auth = require('../middlewares/auth');
const correoRoutes = express.Router();

correoRoutes.get('/obtenerPlantillas', auth.isAuth, async (req, res) => await correoController.findAll(req, res))
    .get('/obtenerPlantilla/:correoId', auth.isAuth, async (req, res) => await correoController.findBy(req, res))
    .post('/crearPlantilla', auth.isAuth, async (req, res) => await correoController.insert(req, res))
    .put('/actualizarPlantilla/:correoId', auth.isAuth, async (req, res) => await correoController.update(req, res))
    .put('/cambiarEstadoPlantilla/:correoId', auth.isAuth, async (req, res) => await correoController.updateStatus(req, res))
    .post('/enviarCorreo/:correoId', auth.isAuth, async (req, res) => {
        await correoController.enviarCorreo(req, res);
    });

module.exports = correoRoutes;
