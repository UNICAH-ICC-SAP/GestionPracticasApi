'use strict'

const db = require('../config/db')
const Docente = db.docente;
const Facultad = db.facultad;
const { Op } = require('sequelize')

module.exports = {
    findAll,
    findBy,
    insert
}

async function insert(req, res) {
    const docente = req.body;
    Docente.create({
        docenteId: docente.docenteId,
        email: docente.email,
        nombre: docente.nombre,
        facultadId: docente.facultadId,
        telefono: docente.telefono

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
    Docente.findAll({ include: [{ model: Facultad }] })
        .then(data => {
            res.status(200).send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Sucedio un error al obtener los registros de Docentees"
            });
        });
};

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
