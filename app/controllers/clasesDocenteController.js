'use strict';

const db = require('../config/db');
const DetallePeriodo = db.detalle_periodo;

module.exports = {
    findAll
};

async function findAll(req, res) {
    const { docenteId, id_periodo } = req.query;

    if (!docenteId || !id_periodo) {
        return res.status(400).send({
            message: "Falta el id del catedrático o el periodo."
        });
    }

    DetallePeriodo.findAll({
        attributes: [
            'seccion',
            [db.Sequelize.fn('MAX', db.Sequelize.col('id_detalle')), 'id_detalle'],
            [db.Sequelize.fn('MAX', db.Sequelize.col('docenteId')), 'docenteId'],
            [db.Sequelize.fn('MAX', db.Sequelize.col('hora_inicio')), 'hora_inicio'],
            [db.Sequelize.fn('MAX', db.Sequelize.col('hora_final')), 'hora_final'],
            [db.Sequelize.fn('MAX', db.Sequelize.col('dia_inicio')), 'dia_inicio'],
            [db.Sequelize.fn('MAX', db.Sequelize.col('dia_final')), 'dia_final']
        ],
        where: {
            id_periodo: id_periodo,
            docenteId: docenteId
        },
        group: ['seccion']
    })
    .then(clase => {
        if (clase.length === 0) {
            return res.status(404).send({
                message: `No se encontraron clases en el periodo ${id_periodo} con el docente ${docenteId}.`
            });
        }
        res.status(200).send(clase);
    })
    .catch(err => {
        res.status(500).send({
            message: err.message || "Error al obtener las clases."
        });
    });
}
