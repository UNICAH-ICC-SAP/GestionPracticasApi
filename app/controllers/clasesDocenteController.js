'use strict';

const db = require('../config/db');
const Sequelize = require('sequelize');
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

    try {
        const resultados = await DetallePeriodo.findAll({
            where: {
                id_periodo: id_periodo,
                docenteId: docenteId
            },
            attributes: [
                'seccion',
                'docenteId',
                'id_periodo',
                'hora_inicio',
                'dia_inicio', 
                'dia_final',
                'hora_final',
                [Sequelize.literal('`clase`.`id_clase`'), 'id_clase']
            ],
            include: [
                {
                    model: db.carrera_clase_bloque,
                    as: 'clase',
                    attributes: [] 
                }
            ],
            group: [
                'seccion', 
                'docenteId', 
                'id_periodo', 
                'hora_inicio', 
                'dia_inicio', 
                'dia_final', 
                'hora_final', 
                'clase.id_clase'
            ]
        });

        res.status(200).send(resultados);
    } catch (err) {
        res.status(500).send({
            message: err.message || "Error al obtener las clases con las relaciones."
        });
    }
}

