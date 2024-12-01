'use strict'

const db = require('../config/db');
const facultad = db.facultad;
const Alumno = db.alumno;
const Facultad = db.facultad;

module.exports = {
    findAll,
    findBy,
    insert,
    findAllData
}

async function insert(req, res) {
    const alumno = req.body;
    Alumno.create({
        alumnoId: alumno.alumnoId,
        email: alumno.email,
        nombre: alumno.nombre,
        facultadId: alumno.facultadId,
        telefono: alumno.telefono

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
    Alumno.findAll({
        include: [{ model: Facultad }]
    })
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

async function findAllData(req, res) {
    Alumno.findAll({ where: req.query, include: [{ model: facultad }] }).then(
        data => {
            res.status(200).send(data)
        }
    ).catch(err => {
        res.status(500).send({
            message: err.message || "Sucedio un error al obtener los registros"
        })
    })
}

async function findBy(req, res) {
    Alumno.findAll({ where: req.query })
        .then(data => {
            const newData = {
                userId: data[0].alumnoId,
                email: data[0].email,
                nombre: data[0].nombre,
                facultadId: data[0].facultadId,
                telefono: data[0].telefono
            }
            res.status(201).send(newData);
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Sucedio un error al obtener los registros de Alumnoes"
            })
        })
}
