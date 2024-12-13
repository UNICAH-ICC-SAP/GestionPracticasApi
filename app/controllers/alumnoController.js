'use strict'

const db = require('../config/db');
const facultad = db.facultad;
const Alumno = db.alumno;
const Facultad = db.facultad;

module.exports = {
    findAll,
    findBy,
    insert,
    findAllData,
    update,
    updateStatus
}

async function insert(req, res) {
    const alumno = req.body;
    Alumno.create({
        alumnoId: alumno.alumnoId,
        email: alumno.email,
        nombre: alumno.nombre,
        facultadId: alumno.facultadId,
        telefono: alumno.telefono,
        estadoAlumno: 1

    }).then(data => {
        res.status(200).send(data);
    }).catch(error => {
        console.error(error)
        res.status(500).send({
            message:
                error.message || "Sucedio un error al obtener los registros de Alumnoes"
        });
    });
}

async function findAll(req, res) {
    Alumno.findAll({
        where: { estadoAlumno: 1 },
        include: [{ model: Facultad }]
    })
        .then(data => {
            res.status(200).send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Sucedio un error al obtener los registros de Alumnoes"
            });
        });
};

async function findAllData(req, res) {
    Alumno.findAll({ where: req.query, include: [{ model: facultad }] }).then(
        data => {
            res.status(200).send(data)
        }
    ).catch(err => {
        res.status(500).send({
            message: err.message || "Sucedio un error al obtener los registros"
        })
    })
}

async function findBy(req, res) {
    Alumno.findAll({ where: req.query, include: [{ model: Facultad }]})
    
        .then(data => {
            const newData = {
                userId: data[0].alumnoId,
                email: data[0].email,
                nombre: data[0].nombre,
                nombreFacultad: data[0].nombreFacultad,
                telefono: data[0].telefono
            }
            res.status(201).send(newData);
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Sucedio un error al obtener los registros de Alumnoes"
            })
        })
}

async function update(req, res) {
    const { alumnoId } = req.query;
    const updatedData = req.body;

    if (!alumnoId) {
        return res.status(400).send({
            message: "El Id del Alumno es necesario para la actualización."
        });
    }

    Alumno.update(updatedData, {
        where: { alumnoId: alumnoId }
    }).then(num => {
        if (num == 1) {
            res.status(200).send({
                message: "Alumno actualizado correctamente."
            });
        } else {
            res.status(404).send({
                message: `No se pudo encontrar ni actualizar el alumno con ID=${alumnoId}`
            });
        }
    }).catch(err => {
        res.status(500).send({
            message: err.message || "Sucedió un error al actualizar el alumno."
        });
    });
}

async function updateStatus(req, res) {
    const alumnoId = req.query.alumnoId;

    if (!alumnoId) {
        return res.status(400).send({
            message: "El Id del alumno es necesario para poder desactivar al alumno."
        });
    }

    try {
        const [num] = await Alumno.update(
            { estadoAlumno: 0 },
            { where: { alumnoId: alumnoId } }
        );

        if (num === 1) {
            res.status(200).send({
                message: "Alumno desactivado correctamente."
            });
        } else {
            res.status(404).send({
                message:`No se pudo encontrar ni desactivar el alumno con ID=${alumnoId}`
            });
        }
    } catch (error) {
        res.status(500).send({
            message: error.message || "Sucedió un error al desactivar el alumno."
   });
}
}