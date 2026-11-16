'use strict';

const db = require('../config/db');
const DetallePeriodo = db.detalle_periodo;

module.exports = {
    findAll
};

async function findAll(req, res) {
    const { docenteId, id_periodo } = req.query;
    if (Number(req.user.roleId) !== 1 && String(docenteId) !== String(req.user.userId)) {
        return res.status(403).send({ message: 'Solo puedes consultar tu propia carga académica.' });
    }

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
            include: [
                {
                    model: db.carrera_clase_bloque,
                    as: 'ccb',
                    attributes: ['id_clase']
                }
            ]
        });

        // Aplanar la respuesta para que id_clase esté en el nivel raíz
        const data = resultados.map((item) => {
            const plain = item.get({ plain: true });
            return {
                seccion: plain.seccion,
                docenteId: plain.docenteId,
                id_periodo: plain.id_periodo,
                hora_inicio: plain.hora_inicio,
                dia_inicio: plain.dia_inicio,
                dia_final: plain.dia_final,
                hora_final: plain.hora_final,
                id_clase: plain.ccb ? String(plain.ccb.id_clase) : null
            };
        });

        res.status(200).send(data);
    } catch (err) {
        res.status(500).send({
            message: err.message || "Error al obtener las clases con las relaciones."
        });
    }
}
