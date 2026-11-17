'use strict'

const db = require('../config/db')
const Terna = db.terna;
const DetalleTerna = db.detalleTerna;
const Alumno = db.alumno;
const { isEmpty } = require('lodash')
const { isAdmin, canAccessStudent } = require('../services/accessService');

async function insert(req, res) {
    const terna = req.body;
    Terna.create({
        alumnoId: terna.alumnoId,
        idEstadoTerna: 2,
    }).then(data => {
        res.status(200).send(data);
    }).catch(error => {
        console.error(error)
        res.status(500).send({
            message: error.message || "Sucedio un error al obtener los registros de Alumnoes"
        });
    });
}

async function findAll(req, res) {
    Terna.findAll({ where: req.accessScope })
        .then(data => {
            res.status(200).send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Sucedio un error al obtener los registros de Alumnoes"
            });
        });
};

async function findBy(req, res) {
    Terna.findAll({ where: { ...req.query, ...req.accessScope }, include: [{ model: DetalleTerna }, { model: Alumno }] })
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

async function updateTerna(req, res) {
    try {
        const { idTerna, estadoTerna } = req.body;
        const terna = await Terna.findByPk(idTerna);

        if (!terna) {
            return res.status(404).send({
                message: 'Terna no encontrada'
            });
        }

        if ((!isAdmin(req.user) && Number(req.user.roleId) !== 2) ||
            !await canAccessStudent(req.user, terna.alumnoId)) {
            return res.status(403).send({ message: 'No tienes permiso para modificar esta terna.' });
        }
        if (![1, 2, 3, 4, 5].includes(Number(estadoTerna))) {
            return res.status(400).send({ message: 'El estado de la terna no es válido.' });
        }

        await terna.update({
            idEstadoTerna: Number(estadoTerna),
        });

        return res.status(200).send({
            message: `Terna Actualizada`
        });
    } catch (error) {
        console.error(error);

        return res.status(500).send({
            message: 'Error actualizando terna'
        });
    }

}

module.exports = {
    findAll,
    findBy,
    insert,
    updateTerna,
}
