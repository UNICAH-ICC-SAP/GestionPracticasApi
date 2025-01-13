'use strict'

const db = require('../config/db')
const accionCorreo = db.accionCorreo;

module.exports = {
    insert,
    findAll,
    update
}

async function insert(req, res) {
    accionCorreo.create({
        accion: req.body['accion'],
        plantillaCorreoId: req.body['id_plantilla'],
    })
        .then(data => {
            res.status(200).send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Sucedio un error al insertar el registro"
            });
        });
};

async function findAll(req, res) {
    accionCorreo.findAll()
        .then(data => {
            if (!data) { res.status(404).send({ message: 'Acciones no encontradas' }) }
            else {
                res.status(200).send(data);
            }
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Sucedio un error al obtener los registros de las acciones"
            })
        })
}

async function update(req, res) {
    const { accion, plantillaCorreoId } = req.body;

    // Validación para verificar si se ha proporcionado un correoId
    await accionCorreo.update(
        { accion, plantillaCorreoId: plantillaCorreoId, },
        { where: { accion: accion } }
    )
        .then(updated => {
            res.status(200).send(updated);
        })
        .catch(error => {
            res.status(500).send({ message: error })
        });

}