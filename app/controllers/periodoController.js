'use strict'

const db = require('../config/db');
const Periodo = db.periodos;

module.exports = {
    insert,
    get
};

async function insert(req, res) {
    const periodo = req.body;

    const fechaInicio = new Date(periodo.fecha_inicio); 
    console.log('Fecha de inicio:', fechaInicio);

    const anioInicio = fechaInicio.getUTCFullYear();
    console.log('Año de inicio:', anioInicio);

    const id_periodo = `${periodo.id_periodo}-${anioInicio}`;

    try {
        const existingPeriodo = await Periodo.findOne({
            where: { id_periodo: id_periodo }
        });

        if (existingPeriodo) {
            return res.status(400).send({
                message: `El período con ID '${id_periodo}' ya existe y no puede ser guardado.`
            });
        }

        const data = await Periodo.create({
            id_periodo: id_periodo,
            fecha_inicio: periodo.fecha_inicio,
            fecha_final: periodo.fecha_final
        });

        res.status(200).send(data);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message || "Sucedió un error al insertar el registro de Periodo"
        });
    }
}

async function get(req, res) {
    try {
        const data = await Periodo.findAll();
        res.status(200).send(data);
    } catch (err) {
        console.error(err);
        res.status(500).send({
            message: err.message || "Sucedió un error al obtener los registros de Periodo"
        });
    }
}
