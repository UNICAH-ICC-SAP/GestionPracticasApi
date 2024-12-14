'use strict';

const db = require('../config/db');
const DetalleTerna = db.detalleTerna;
const Docente = db.docente;
const Terna = db.terna;

module.exports = {
    findAll,
    findBy,
    insert
};

async function insert(req, res) {
    try {
        const detalleTernas = req.body;
        if (!Array.isArray(detalleTernas)) {
            return res.status(400).send({
                message: "Se esperaba un array de objetos para insertar múltiples registros."
            });
        }
        const data = await DetalleTerna.bulkCreate(detalleTernas);

        // Responder con los registros creados
        res.status(200).send(data);
    } catch (error) {
        console.error("Error al insertar registros en detalleTerna:", error);
        res.status(500).send({
            message: error.message || "Ocurrió un error al intentar guardar los registros en detalleTerna."
        });
    }
}

async function findAll(req, res) {
    try {
        const data = await DetalleTerna.findAll({
            include: [{ model: Docente }, {model: Terna}]
        });
        res.status(200).send(data);
    } catch (error) {
        console.error("Error al obtener registros de DetalleTerna:", error);
        res.status(500).send({
            message: error.message || "Ocurrió un error al obtener los registros de DetalleTerna."
        });
    }
}

async function findBy(req, res) {
    try {
        const data = await DetalleTerna.findAll({
            where: req.query
        });
        res.status(200).send(data);
    } catch (error) {
        console.error("Error al obtener registros de DetalleTerna por criterio:", error);
        res.status(500).send({
            message: error.message || "Ocurrió un error al obtener los registros de DetalleTerna."
        });
    }
}
