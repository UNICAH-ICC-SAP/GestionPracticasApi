'use strict'

const db = require('../config/db')
const Pensum = db.clases;
const CarreraClaseBloque = db.carrera_clase_bloque;
const { Op } = require('sequelize')

module.exports = {
    get,
    getPensumBy,
    insert,
    update,
    updateStatus,
    getClassBy
}

async function get(req, res) {
    Pensum.findAll() 
        .then(data => {
            res.status(200).send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Sucedió un error al obtener los registros de Pensum"
            });
        });
}

async function getClassBy(req, res) {
    const { id_carrera } = req.query;

    try {
        const clases = await CarreraClaseBloque.findAll({
            where: { id_carrera: id_carrera },
            include: [{
                model: Pensum,
                as: 'clase', 
                attributes: ['id_clase', 'nombre_clase', 'creditos', 'estado', 'es_lab']
            }]
        });

        res.status(200).send(clases);
    } catch (err) {
        console.error(err);
        res.status(500).send({
            message: err.message || "Sucedió un error al obtener las clases por carrera"
        });
    }
}



async function insert(req, res) {
    const pensum = req.body;
    Pensum.create({
        id_clase: pensum.id_clase,
        nombre_clase: pensum.nombre_clase,
        creditos: pensum.creditos,
        estado: pensum.estado,
        es_lab: pensum.es_lab
    }).then(data => {
        CarreraClaseBloque.create({
            id_carrera: pensum.id_carrera,
            id_clase: data.id_clase,
            id_bloque: pensum.id_bloque
        }).then(() => {
            res.status(200).send(data);
        }).catch(error => {
            console.error(error);
            res.status(500).send({
                message: error.message || "Sucedió un error al crear el registro en carrera_clase_bloque"
            });
        });
    }).catch(error => {
        console.error(error)
        res.status(500).send({
            message: error.message || "Sucedio un error al obtener los registros de Pensum"
        });
    });
}

async function update(req, res) {
    const { id_clase } = req.query;
    const updatedData = req.body;

    if (!id_clase) {
        return res.status(400).send({
            message: "El Id de la clase es necesario para la actualización."
        });
    }
    Pensum.update(updatedData, {
        where: { id_clase: id_clase }
    }).then(num => {
        if (num == 1) {
            if (updatedData.id_bloque) {
                CarreraClaseBloque.update(
                    { id_bloque: updatedData.id_bloque },
                    { where: { id_clase: id_clase } }
                ).then(bloqueNum => {
                    if (bloqueNum == 1) {
                        res.status(200).send({
                            message: "Clase y bloque actualizado correctamente."
                        });
                    } else {
                        res.status(404).send({
                            message: `No se pudo actualizar el bloque de la clase con ID=${id_clase}.`
                        });
                    }
                }).catch(err => {
                    res.status(500).send({
                        message: err.message || "Sucedió un error al actualizar el bloque de la clase."
                    });
                });
            } else {
                res.status(200).send({
                    message: "Clase actualizada correctamente."
                });
            }
        } else {
            res.status(404).send({
                message: `No se pudo encontrar ni actualizar la clase con ID=${id_clase}.`
            });
        }
    }).catch(err => {
        res.status(500).send({
            message: err.message || "Sucedió un error al actualizar la clase."
        });
    });
}



async function updateStatus(req, res) {
    const id_clase = req.query.id_clase;

    if (!id_clase) {
        return res.status(400).send({
            message: "El Id de la clase es necesario para poder modificar el estado de la clase."
        });
    }

    try {
        const clase = await Pensum.findOne({ where: { id_clase: id_clase } });

        if (!clase) {
            return res.status(404).send({
                message: `No se pudo encontrar la clase con ID=${id_clase}.`
            });
        }

        const nuevoEstado = clase.estado === false ? 1 : 0;


        const [num] = await Pensum.update(
            { estado: nuevoEstado },
            { where: { id_clase: id_clase } }
        );

        if (num === 1) {
            res.status(200).send({
                message: `Clase ${nuevoEstado === 1 ? 'activada' : 'desactivada'} correctamente.`
            });
        } else {
            res.status(404).send({
                message: `No se pudo modificar el estado de la clase con ID=${id_clase}.`
            });
        }
    } catch (error) {
        res.status(500).send({
            message: error.message || "Sucedió un error al modificar el estado de la clase."
        });
    }
}