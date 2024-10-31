'use strict'

const db = require('../config/db')
const Docente = db.docente;
const Facultad = db.facultad;
const { Op } = require('sequelize')

module.exports = {
    findAll,
    findBy,
    insert,
    update,
    updateStatus
}

async function insert(req, res) {
    const docente = req.body;
    Docente.create({
        docenteId: docente.docenteId,
        email: docente.email,
        nombre: docente.nombre,
        facultadId: docente.facultadId,
        telefono: docente.telefono,
        estadoDocente: 1

    }).then(data => {
        res.status(200).send(data);
    }).catch(error => {
        console.error(error)
        res.status(500).send({
            message:
                error.message || "Sucedio un error al obtener los registros de Docentees"
        });
    });
}

async function findAll(req, res) {
    Docente.findAll({
        where: { estadoDocente: 1 },
        include: [{ model: Facultad }]
    })
    .then(data => {
        res.status(200).send(data);
    })
    .catch(err => {
        res.status(500).send({
            message: err.message || "Sucedió un error al obtener los registros de docentes."
        });
    });
}

async function findBy(req, res) {
    Docente.findAll({ where: req.query })
        .then(data => {
            const newData = {
                userId: data[0].docenteId,
                email: data[0].email,
                nombre: data[0].nombre,
                facultadId: data[0].facultadId,
                telefono: data[0].telefono
            }
            res.status(201).send(newData);
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Sucedio un error al obtener los registros de Docentees"
            })
        })
}

async function update(req, res) {
    const {docenteId} = req.query;
    const updatedData = req.body;

    if (!docenteId) {
        return res.status(400).send({
            message: "El Id del docente es necesario para la actualización."
        });
    }

    Docente.update(updatedData, {
        where: { docenteId: docenteId }
    }).then(num => {
        if (num == 1) {
            res.status(200).send({
                message: "Docente actualizado correctamente."
            });
        } else {
            res.status(404).send({
                message: `No se pudo encontrar ni actualizar el docente con ID=${docenteId}.`
            });
        }
    }).catch(err => {
        res.status(500).send({
            message: err.message || "Sucedió un error al actualizar el docente."
        });
    });
}

async function updateStatus(req, res) {
    const docenteId = req.query.docenteId;

    if (!docenteId) {
        return res.status(400).send({
            message: "El Id del docente es necesario para poder desactivar al docente."
        });
    }

    try {
        const [num] = await Docente.update(
            { estadoDocente: 0 },
            { where: { docenteId: docenteId } }
        );

        if (num === 1) {
            res.status(200).send({
                message: "Docente desactivado correctamente."
            });
        } else {
            res.status(404).send({
                message: `No se pudo encontrar ni desactivar el docente con ID=${docenteId}.`
            });
        }
    } catch (error) {
        res.status(500).send({
            message: error.message || "Sucedió un error al desactivar el docente."
        });
    }
}