'use strict'

const db = require('../config/db')
const Documento = db.documento
const { Op } = require('sequelize')

module.exports = {
    findAll,
    findBy,
    insert
}

async function insert(req, res) {
    const documento = req.body;
    Documento.create({
        documentoId: documento.documentoId,
        nombreArchivo: documento.nombreArchivo,
        ruta: documento.ruta,
        estado: 0

    }).then(data => {
        res.status(200).send(data);
    }).catch(error => {
        console.error(error)
        res.status(500).send({
            message:
                error.message || "Sucedio un error al obtener los registros de Documentaciones"
        });
    });
}

async function findAll(req, res) {
    Documento.findAll()
        .then(data => {
            res.status(200).send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Sucedio un error al obtener los registros de Documentaciones"
            });
        });
};

async function findBy(req, res) {
    Documento.findAll({ where: req.query })
        .then(data => {
            res.status(201).send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Sucedio un error al obtener los registros de Documentaciones"
            })
        })
}
