'use strict'

const db = require('../config/db');
const Plantilla_Correo = db.plantilla_correo;
const AccionesPlantillaCorreo = db.accionCorreo;
const nodemailer = require('nodemailer'); // Importar Nodemailer
const he = require('he');
require('dotenv').config();

module.exports = {
    findAll,
    findBy,
    insert,
    update,
    updateStatus,
    enviarCorreo
}

// API para obtener las plantillas de correo activas
async function findAll(req, res) {
    try {
        const templates = await Plantilla_Correo.findAll({
            attributes: ['Id_correo', 'correo_origen', 'asunto', 'cuerpo', 'estado'],
            where: { estado: true }
        });
        res.status(200).json(templates);
    } catch {
        res.status(500).json({
            message: 'Error al obtener plantillas'
        });
    }
}

// API para obtener una plantilla por su ID
async function findBy(req, res) {
    try {
        const id = parseInt(req.params.correoId, 10);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'El ID proporcionado no es válido.' });
        }

        const template = await Plantilla_Correo.findByPk(id, {
            attributes: ['Id_correo', 'correo_origen', 'asunto', 'cuerpo', 'estado']
        });

        if (!template) {
            return res.status(404).json({ message: 'Plantilla no encontrada' });
        }

        res.json(template);
    } catch {
        res.status(500).json({ message: 'Error al obtener detalles de la plantilla' });
    }
}

// API para crear una nueva plantilla de correo
async function insert(req, res) {
    const { correo_origen, correo_password, asunto, cuerpo } = req.body;

    try {
        const nuevaPlantilla = await Plantilla_Correo.create({
            correo_origen,
            correo_password,
            asunto,
            cuerpo,
            estado: 1 // Estado activo por defecto
        });

        res.status(201).json({
            message: 'Plantilla creada exitosamente',
            templateId: nuevaPlantilla.Id_correo // Retorna el ID de la nueva plantilla creada
        });
    } catch {
        res.status(500).json({
            message: 'Error al crear plantilla'
        });
    }
}

// API para actualizar una plantilla de correo
async function update(req, res) {
    const { correoId } = req.params;
    const { correo_origen, correo_password, asunto, cuerpo } = req.body;

    // Validación para verificar si se ha proporcionado un correoId
    if (!correoId) {
        return res.status(400).json({
            message: "El Id de la plantilla es necesario para la actualización."
        });
    }

    try {
        const [updated] = await Plantilla_Correo.update(
            { correo_origen, asunto, cuerpo, ...(correo_password ? { correo_password } : {}) },
            { where: { Id_correo: correoId } }
        );

        if (updated) {
            const updated = await Plantilla_Correo.findByPk(correoId, {
                attributes: ['Id_correo', 'correo_origen', 'asunto', 'cuerpo']
            });
            res.json({
                message: 'Plantilla actualizada exitosamente',
                template: updated
            });
        } else {
            res.status(404).json({ message: 'Plantilla no encontrada' });
        }
    } catch {
        res.status(500).json({
            message: 'Error al actualizar la plantilla'
        });
    }
}

// API para cambiar el estado de una plantilla de correo (activo/inactivo)
async function updateStatus(req, res) {
    const { correoId } = req.params;
    const { estado } = req.body;

    // Validación para verificar si se ha proporcionado un correoId
    if (!correoId) {
        return res.status(400).send({
            message: "El Id de la plantilla es necesario para cambiar el estado."
        });
    }

    try {
        const plantilla = await Plantilla_Correo.update({ estado }, {
            where: { Id_correo: correoId }
        });

        if (plantilla[0] === 1) {
            res.status(200).send({ message: 'Plantilla desactivada correctamente.' });
        } else {
            res.status(404).send({ message: 'Plantilla no encontrada.' });
        }
    } catch {
        res.status(500).send({ message: 'No se pudo actualizar el estado de la plantilla.' });
    }
}

// API para enviar el correo con la plantilla
async function enviarCorreo(req, res) {
    const { accion } = req.params;
    const { correoDestino } = req.body;
    if (!accion || typeof correoDestino !== 'string' || !correoDestino.trim()) {
        return res.status(400).json({ message: 'La acción y el correo de destino son requeridos.' });
    }

    let transporter;
    try {
        const response = await AccionesPlantillaCorreo.findOne({
            where: { accion },
            include: [{ model: Plantilla_Correo }]
        });
        if (!response || !response.plantilla_correo) {
            return res.status(404).send({ message: 'Plantilla no encontrada o inactiva.' });
        }
        const template = response.plantilla_correo.get({ plain: true });
        if (!template.estado) return res.status(404).send({ message: 'Plantilla no encontrada o inactiva.' });

        let cuerpo = template.cuerpo;
        Object.entries(req.body).forEach(([key, value]) => {
            cuerpo = cuerpo.split(`{{${key}}}`).join(he.encode(String(value)));
        });
        transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: { user: template.correo_origen, pass: template.correo_password }
        });
        await transporter.sendMail({
            from: template.correo_origen,
            to: correoDestino,
            subject: template.asunto,
            html: cuerpo
        });
        return res.status(200).send({ message: 'Correo enviado exitosamente.' });
    } catch {
        return res.status(500).send({ message: 'No se pudo enviar el correo.' });
    } finally {
        if (transporter) transporter.close();
    }
}
