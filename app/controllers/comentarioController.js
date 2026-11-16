'use strict';

const db = require('../config/db');
const Comentario = db.comentario;
const Docente = db.docente;

module.exports = {
    create,
    getByReferencia
};

async function create(req, res) {
    try {
        const { modulo, referenciaId, userId, mensaje } = req.body;
        if (!modulo || !referenciaId || !userId || !mensaje) {
            return res.status(400).send({
                message: "Campos requeridos: modulo, referenciaId, userId, mensaje."
            });
        }
        const nuevoComentario = await Comentario.create({
            modulo,
            referenciaId,
            userId,
            mensaje
        });

        const docente = await Docente.findOne({ where: { docenteId: userId } });
        const result = {
            ...nuevoComentario.toJSON(),
            autor: docente ? docente.nombre : `Docente (${userId})`
        };

        res.status(200).send(result);
    } catch (error) {
        console.error("Error al crear comentario:", error);
        res.status(500).send({
            message: error.message || "Ocurrió un error al guardar el comentario."
        });
    }
}

async function getByReferencia(req, res) {
    try {
        const { modulo, referenciaId } = req.query;
        if (!modulo || !referenciaId) {
            return res.status(400).send({
                message: "Parametros requeridos: modulo y referenciaId."
            });
        }
        const comentarios = await Comentario.findAll({
            where: {
                modulo,
                referenciaId,
                eliminado: false
            },
            order: [['createdAt', 'ASC']]
        });

        const userIds = Array.from(new Set(comentarios.map(c => c.userId)));
        let docentesMap = new Map();
        if (userIds.length > 0) {
            const docentes = await Docente.findAll({ where: { docenteId: userIds } });
            docentesMap = new Map(docentes.map(d => [d.docenteId, d.nombre]));
        }

        const result = comentarios.map(c => ({
            ...c.toJSON(),
            autor: docentesMap.get(c.userId) || `Docente (${c.userId})`
        }));

        res.status(200).send(result);
    } catch (error) {
        console.error("Error al obtener comentarios:", error);
        res.status(500).send({
            message: error.message || "Ocurrió un error al obtener los comentarios."
        });
    }
}
