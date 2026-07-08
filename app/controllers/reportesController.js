'use strict'

const db = require('../config/db');

module.exports = {
    getResumen
};

async function getResumen(req, res) {
    try {
        const docentes = await db.docente.count();
        const clases = await db.clases.count();
        const ternas = await db.terna.count();
        const clasesAperturadas = await db.detalle_periodo.count();

        res.status(200).send({
            docentes,
            clases,
            ternas,
            clasesAperturadas
        });

    } catch (err) {
        res.status(500).send({
            message: err.message || 'Error al obtener reportes'
        });
    }
}