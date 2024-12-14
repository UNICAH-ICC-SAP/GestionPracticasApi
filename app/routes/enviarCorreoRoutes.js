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
        const { correoId } = req.params;  // El correoId viene desde los parámetros de la ruta
        const { correoDestino, userId, nombreUsuario } = req.body; // Los demás datos vienen en el body
    
        // Validar que todos los parámetros necesarios están presentes
        if (!correoId || !correoDestino || !userId || !nombreUsuario) {
            return res.status(400).json({ message: 'Faltan parámetros en el cuerpo de la solicitud.' });
        }
    
        req.params = { correoId, userId, nombreUsuario, correoDestino };
    
        await correoController.enviarCorreo(req, res, userId, nombreUsuario, correoDestino);
    });

module.exports = correoRoutes;
