'use strict'

const db = require('../config/db')
const Facultad = db.facultad;

module.exports = {
    findAll,
    findBy,
    insert
}

async function insert(req, res) {
    const facultad = req.body;
    Facultad.create({
        facultadId: facultad.facultadId,
        nombreFacultad: facultad.nombreFacultad
    }).then(data => {
        res.status(200).send(data);
    }).catch(error => {
        console.error(error)
        res.status(500).send({
            message:
                error.message || "Sucedio un error al obtener los registros de Facultades"
        });
    });
}

async function findAll(req, res) {
    Facultad.findAll()
        .then(data => {
            res.status(200).send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Sucedio un error al obtener los registros de Facultades"
            });
        });
};

async function findBy(req, res) {
    Facultad.findAll({ where: req.query })
        .then(data => {
            res.status(201).send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Sucedio un error al obtener los registros de Facultades"
            })
        })
}
