'use strict'

const db = require('../config/db')
const DetalleDocumentacion = db.detalleDocumentacion;

module.exports = {
    findAll,
    findBy,
    insert
}

async function insert(req, res) {
    const documentacion = req.body;
    DetalleDocumentacion.create({
        documentacionId: documentacion.documentacionId,
        documentoId: documentacion.documentoId
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
    DetalleDocumentacion.findAll()
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
    DetalleDocumentacion.findAll({ where: req.query })
        .then(data => {
            res.status(201).send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Sucedio un error al obtener los registros de Documentaciones"
            })
        })
}
