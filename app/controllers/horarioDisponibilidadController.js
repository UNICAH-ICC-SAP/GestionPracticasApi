'use strict';

const db = require('../config/db');
const HorarioDisponibilidad = db.horario_disponibilidad;

module.exports = {
    get,
    upsert,
    deleteAll
};

async function get(req, res) {
    const { docenteId } = req.query;

    if (!docenteId) {
        return res.status(400).send({
            message: "Se requiere el docenteId."
        });
    }

    try {
        const registros = await HorarioDisponibilidad.findAll({
            where: { docenteId }
        });

        res.status(200).send(registros);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message || "Error al obtener la disponibilidad del docente."
        });
    }
}

async function upsert(req, res) {
    const { docenteId, disponibilidades } = req.body;

    if (!docenteId || !Array.isArray(disponibilidades)) {
        return res.status(400).send({
            message: "Se requiere docenteId y un array de disponibilidades."
        });
    }

    try {
        await HorarioDisponibilidad.destroy({
            where: { docenteId }
        });

        const registros = [];
        for (const item of disponibilidades) {
            if (item.disponible) {
                const registro = await HorarioDisponibilidad.create({
                    docenteId,
                    dia: item.dia,
                    franja_inicio: item.franja_inicio,
                    franja_fin: item.franja_fin,
                    disponible: 1
                });
                registros.push(registro);
            }
        }

        res.status(200).send({
            message: "Disponibilidad actualizada correctamente.",
            registros
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message || "Error al actualizar la disponibilidad."
        });
    }
}

async function deleteAll(req, res) {
    const { docenteId } = req.query;

    if (!docenteId) {
        return res.status(400).send({
            message: "Se requiere el docenteId."
        });
    }

    try {
        const eliminados = await HorarioDisponibilidad.destroy({
            where: { docenteId }
        });

        res.status(200).send({
            message: "Disponibilidad eliminada correctamente.",
            registrosEliminados: eliminados
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message || "Error al eliminar la disponibilidad."
        });
    }
}
