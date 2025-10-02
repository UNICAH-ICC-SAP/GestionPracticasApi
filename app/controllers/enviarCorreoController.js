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
            attributes: ['Id_correo', 'correo_origen', 'correo_password', 'asunto', 'cuerpo', 'estado'],
            where: { estado: true }
        });
        res.status(200).json(templates);
    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener plantillas',
            error: error.message
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
            attributes: ['Id_correo', 'correo_origen', 'correo_password', 'asunto', 'cuerpo', 'estado']
        });

        if (!template) {
            return res.status(404).json({ message: 'Plantilla no encontrada' });
        }

        res.json(template);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener detalles de la plantilla', error: error.message });
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
    } catch (error) {
        res.status(500).json({
            message: 'Error al crear plantilla',
            error: error.message
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
            { correo_origen, correo_password, asunto, cuerpo },
            { where: { Id_correo: correoId } }
        );

        if (updated) {
            const updated = await Plantilla_Correo.findByPk(correoId, {
                attributes: ['Id_correo', 'correo_origen', 'correo_password', 'asunto', 'cuerpo']
            });
            res.json({
                message: 'Plantilla actualizada exitosamente',
                template: updated
            });
        } else {
            res.status(404).json({ message: 'Plantilla no encontrada' });
        }
    } catch (error) {
        res.status(500).json({
            message: 'Error al actualizar la plantilla',
            error: error.message
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
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
}

// API para enviar el correo con la plantilla
async function enviarCorreo(req, res) {
    const { accion } = req.params;
    console.log(accion)
    const { correoDestino } = req.body;
    if (!accion) {
        return res.status(400).json({
            message: 'Faltan datos requeridos',
        });
    }

    // try {
    //     const plantillaCorreo = await Plantilla_Correo.findOne({
    //         where: { Id_correo: parseInt(correoId, 10), estado: 1 }
    //     });

    const accionPlantillaResponse = await AccionesPlantillaCorreo.findOne({
        where: { accion: accion },
        include: [
            {
                model: Plantilla_Correo,
            }
        ]
    });
    const accionPlantilla = accionPlantillaResponse.plantilla_correo.get({ plain: true });
    console.log(accionPlantilla)
    if (!accionPlantilla) {
        return res.status(404).send({ message: 'Plantilla no encontrada o inactiva.' });
    }
    let cuerpoPersonalizado = accionPlantilla.cuerpo;

    const entries = Object.entries(req.body);
    console.log(entries)
    entries.forEach(item => {
        cuerpoPersonalizado = cuerpoPersonalizado.replace(`{{${item[0]}}}`, he.encode(item[1]))
        console.log(item[0])
    });


    const transporter = nodemailer.createTransport({
        service: 'gmail',
        host: "smtp.gmail.com",
        port: 587,
        secure: true, // upgrade later with STARTTLS
        auth: {
            user: accionPlantilla.correo_origen,
            pass: accionPlantilla.correo_password,
        },
    });
    const mailOptions = {
        from: `Unidad Acádemica SAP ${he.encode(accionPlantilla.correo_origen)}`,
        to: he.encode(correoDestino),
        subject: he.encode(accionPlantilla.asunto),
        html: cuerpoPersonalizado
    };

    await transporter.sendMail(mailOptions)
        .then(result => {
            res.status(200).send({ message: 'Correo enviado exitosamente', detalles: result });
            transporter.close();
        }).catch(error => {
            res.status(500).send({ message: 'Error al enviar correo', error: error.message });
        });
}