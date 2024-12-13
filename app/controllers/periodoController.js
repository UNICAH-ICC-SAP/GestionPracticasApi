'use strict'

const db = require('../config/db')
const Periodo = db.periodos;
module.exports = {
    insert,
    get
}

async function insert(req, res) {
    const periodo = req.body;
    Periodo.create({
        id_periodo: periodo.id_periodo,
        fecha_inicio: periodo.fecha_inicio,
        fecha_final: periodo.fecha_final

    }).then(data => {
        res.status(200).send(data);
    }).catch(error => {
        console.error(error)
        res.status(500).send({
            message:
                error.message || "Sucedio un error al insertar el registro de Periodo"
        });
    });
}

async function get(req, res) {
    Periodo.findAll()
        .then(data => {
            res.status(200).send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Sucedió un error al obtener los registros de Periodo"
            });
        });
}