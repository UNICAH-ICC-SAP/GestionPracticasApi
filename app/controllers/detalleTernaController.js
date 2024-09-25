'use strict'

const db = require('../config/db')
const DetalleTerna = db.detalleTerna;
const Docente = db.docente;
const { Op } = require('sequelize')

module.exports = {
    findAll,
    findBy,
    insert
}

async function insert(req, res) {
    const detalleTerna = req.body;
    DetalleTerna.create({
        ternaId: detalleTerna.ternaId,
        docenteId: detalleTerna.docenteId,
        coordina: detalleTerna.coordina,
    }).then(data => {
        res.status(200).send(data);
    }).catch(error => {
        console.error(error)
        res.status(500).send({
            message:
                error.message || "Sucedio un error al obtener los registros de Alumnoes"
        });
    });
}

async function findAll(req, res) {
    DetalleTerna.findAll({ include: [{ model: Docente }] })
        .then(data => {
            res.status(200).send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Sucedio un error al obtener los registros de DetalleTerna"
            });
        });
};

async function findBy(req, res) {
    DetalleTerna.findAll({ where: req.query })
        .then(data => {
            res.status(201).send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Sucedio un error al obtener los registros de DetalleTerna"
            })
        })
}
