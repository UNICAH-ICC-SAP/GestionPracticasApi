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
    .post('/enviarCorreo', auth.isAuth, async (req, res) => {
        const { correoId, userId, pass, nombreUsuario, correoDestinatario } = req.body; 

        // Validar que todos los parámetros necesarios están presentes
        if (!correoId || !userId || !pass || !nombreUsuario || !correoDestinatario) {
            return res.status(400).json({ message: 'Faltan parámetros en el cuerpo de la solicitud.' });
        }

        req.params = { correoId, userId, pass, nombreUsuario, correoDestinatario }; 

        await correoController.enviarCorreo(req, res, userId, pass, nombreUsuario, correoDestinatario);
    });

module.exports = correoRoutes;
