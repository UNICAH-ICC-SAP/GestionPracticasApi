'use strict'

const db = require('../config/db')
const Terna = db.terna;
const DetalleTerna = db.detalleTerna;
const Alumno = db.alumno;
const { isEmpty } = require('lodash')

module.exports = {
    findAll,
    findBy,
    insert
}

async function insert(req, res) {
    const terna = req.body;
    Terna.create({
        alumnoId: terna.alumnoId,
        idEstadoTerna: 2,
    }).then(data => {
        res.status(200).send({ ...data['dataValues'], ternaId: data['null'] });
    }).catch(error => {
        console.error(error)
        res.status(500).send({
            message:
                error.message || "Sucedio un error al obtener los registros de Alumnoes"
        });
    });
}

async function findAll(req, res) {
    Terna.findAll()
        .then(data => {
            res.status(200).send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Sucedio un error al obtener los registros de Alumnoes"
            });
        });
};

async function findBy(req, res) {
    Terna.findAll({ where: req.query, include: [{ model: DetalleTerna }, { model: Alumno }] })
        .then(data => {
            if (isEmpty(data)) res.status(201).send({ message: 'No Data' })
            else {
                res.status(201).send(data);
            }
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Sucedio un error al obtener los registros de Alumnoes"
            })
        })
}