'use strict'

const db = require('../config/db')
const Terna = db.terna;
const DetalleTerna = db.detalleTerna;
const Alumno = db.alumno;
const Docente = db.docente;
const File = db.file;
const { isEmpty } = require('lodash')

async function insert(req, res) {
    const terna = req.body;
    Terna.create({
        alumnoId: terna.alumnoId,
        idEstadoTerna: 2,
    }).then(data => {
        res.status(200).send({ ...data['dataValues'], ternaId: data['null'] });
    }).catch(error => {
        console.error(error)
        res.status(500).send({
            message: error.message || "Sucedio un error al obtener los registros de Alumnoes"
        });
    });
}

async function findAll(req, res) {
    Terna.findAll()
        .then(data => {
            res.status(200).send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Sucedio un error al obtener los registros de Alumnoes"
            });
        });
};

async function findBy(req, res) {
    Terna.findAll({ where: req.query, include: [{ model: DetalleTerna }, { model: Alumno }] })
        .then(data => {
            if (isEmpty(data)) res.status(201).send({ message: 'No Data' })
            else {
                res.status(201).send(data);
            }
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Sucedio un error al obtener los registros de Alumnoes"
            })
        })
}

async function updateTerna(req, res) {
    try {
        const { idTerna, estadoTerna } = req.body;
        const terna = await Terna.findByPk(idTerna);

        if (!terna) {
            return res.status(404).send({
                message: 'Terna no encontrada'
            });
        }

        await terna.update({
            idEstadoTerna: estadoTerna,
        });

        return res.status(200).send({
            message: `Terna Actualizada`
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: 'Error actualizando terna'
        });
    }
}

async function cancelarTerna(req, res) {
    try {
        const { idTerna } = req.body;
        const terna = await Terna.findByPk(idTerna);

        if (!terna) {
            return res.status(404).send({ message: 'Terna no encontrada' });
        }

        await terna.update({ idEstadoTerna: 3 });

        return res.status(200).send({ message: 'Terna cancelada correctamente' });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: 'Error al cancelar la terna' });
    }
}

async function getMonografiaCompleta(req, res) {
    try {
        const { ternaId } = req.query;

        if (!ternaId) {
            return res.status(400).send({ message: 'ternaId es requerido' });
        }

        const terna = await Terna.findOne({
            where: { ternaId },
            include: [
                { model: Alumno },
                {
                    model: DetalleTerna,
                    include: [{ model: Docente }]
                }
            ]
        });

        if (!terna) {
            return res.status(404).send({ message: 'Terna no encontrada' });
        }

        const monografiaFile = await File.findOne({
            where: {
                userId: terna.alumnoId,
                fileTypeId: 6
            }
        });

        const StatusTernaMap = {
            1: 'Inactiva',
            2: 'En Curso',
            3: 'Revision Monografia',
            4: 'Agendada',
            5: 'Finalizada'
        };

        const ternaData = terna.toJSON();

        const docentes = (ternaData.detalleTernas || []).map(dt => ({
            docenteId: dt.docenteId,
            nombre: dt.docente ? dt.docente.nombre : 'Sin nombre',
            email: dt.docente ? dt.docente.email : '',
            telefono: dt.docente ? dt.docente.telefono : '',
            rol: dt.rol
        }));

        const response = {
            ternaId: ternaData.ternaId,
            estado: StatusTernaMap[ternaData.idEstadoTerna] || 'Desconocido',
            idEstadoTerna: ternaData.idEstadoTerna,
            alumno: {
                alumnoId: ternaData.alumno ? ternaData.alumno.alumnoId : '',
                nombre: ternaData.alumno ? ternaData.alumno.nombre : 'Sin nombre',
                email: ternaData.alumno ? ternaData.alumno.email : '',
                telefono: ternaData.alumno ? ternaData.alumno.telefono : '',
                facultadId: ternaData.alumno ? ternaData.alumno.facultadId : ''
            },
            docentes,
            monografia: monografiaFile ? {
                archivoId: monografiaFile.archivoId,
                originalName: monografiaFile.originalName,
                fileUrl: monografiaFile.fileUrl,
                status: monografiaFile.status,
                fileStatus: monografiaFile.fileStatus,
                mimeType: monografiaFile.mimeType,
                sizeBytes: monografiaFile.sizeBytes
            } : null
        };

        return res.status(200).send(response);
    } catch (error) {
        console.error('Error en getMonografiaCompleta:', error);
        return res.status(500).send({
            message: error.message || 'Error al obtener datos de monografia'
        });
    }
}

module.exports = {
    findAll,
    findBy,
    insert,
    updateTerna,
    cancelarTerna,
    getMonografiaCompleta,
}