'use strict'

const db = require('../config/db')
const Role = db.role;
const { Op } = require('sequelize')

module.exports = {
    findAll,
    findBy
}

async function findAll(req, res) {
    Role.findAll()
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Sucedio un error al obtener los registros de Rolees"
            });
        });
};

async function findBy(req, res) {
    Role.findAll({ where: req.query })
        .then(data => {
            res.status(201).send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Sucedio un error al obtener los registros de Rolees"
            })
        })
}