'use strict';

const db = require('../config/db');
const Periodo = db.periodos;
const DetallePeriodo = db.detalle_periodo;
const CarreraClaseBloque = db.carrera_clase_bloque;
const Clase = db.clases;
const { Op } = require('sequelize'); // Operadores de Sequelize

module.exports = {
    insert
};

async function insert(req, res) {
    try {
        const { 
            id_clase, hora_inicio, hora_final, docenteId, 
            dia_inicio, dia_final, horario_especial 
        } = req.body;

        // 1. Obtener el periodo actual
        const periodo = await Periodo.findOne({
            attributes: ['id_periodo', 'fecha_inicio', 'fecha_final'],
            order: [['fecha_final', 'DESC']],
            limit: 1
        });

        if (!periodo) {
            return res.status(400).json({ message: "No se encontró el periodo actual" });
        }

        // 2. Verificar tipo de clase
        const clase = await Clase.findOne({
            attributes: ['TipoClase'],
            where: { id_clase }
        });

        if (!clase) {
            return res.status(400).json({ message: "Clase no encontrada" });
        }

        // 3. Obtener los bloques de la clase
        const bloques = await CarreraClaseBloque.findAll({
            attributes: ['id_ccb', 'facultadId'],
            where: { id_clase }
        });

        if (!bloques || bloques.length === 0) {
            return res.status(400).json({ message: "No se encontraron bloques para la clase" });
        }

        // 4. Generar hora final si no está presente y horario especial es 0
        let horaFinalGenerada = hora_final;

        if (!hora_final && horario_especial === 0) {
            if ([1, 4].includes(clase.TipoClase)) {
                horaFinalGenerada = new Date(hora_inicio);
                horaFinalGenerada.setMinutes(horaFinalGenerada.getMinutes() + 50); // 50 minutos
            } else if ([2, 3].includes(clase.TipoClase)) {
                horaFinalGenerada = new Date(hora_inicio);
                horaFinalGenerada.setMinutes(horaFinalGenerada.getMinutes() + 110); // 1 hora 50 minutos
            }
        } else if (horario_especial === 1) {
            horaFinalGenerada = hora_final;
        }

        // 5. Validaciones de horarios por bloque de clase
        for (const bloque of bloques) {
            const conflicto = await DetallePeriodo.findOne({
                where: {
                    id_periodo: periodo.id_periodo,
                    id_ccb: bloque.id_ccb,
                    [Op.or]: [
                        {
                            [Op.and]: [
                                { hora_inicio: { [Op.lte]: hora_inicio } },
                                { hora_final: { [Op.gte]: hora_inicio } }
                            ]
                        },
                        {
                            [Op.and]: [
                                { hora_inicio: { [Op.lte]: horaFinalGenerada } },
                                { hora_final: { [Op.gte]: horaFinalGenerada } }
                            ]
                        },
                        {
                            [Op.and]: [
                                { dia_inicio: { [Op.lte]: dia_inicio } },
                                { dia_final: { [Op.gte]: dia_inicio } }
                            ]
                        }
                    ]
                }
            });

            if (conflicto) {
                return res.status(400).json({
                    message: `Choque de horario en la facultad con ID ${bloque.facultadId}`,
                    id_ccb: bloque.id_ccb
                });
            }
        }

        // 6. Validación docente
        const conflictoDocente = await DetallePeriodo.findOne({
            where: {
                id_periodo: periodo.id_periodo,
                docenteId,
                [Op.or]: [
                    {
                        [Op.and]: [
                            { hora_inicio: { [Op.lte]: hora_inicio } },
                            { hora_final: { [Op.gte]: hora_inicio } }
                        ]
                    },
                    {
                        [Op.and]: [
                            { hora_inicio: { [Op.lte]: horaFinalGenerada } },
                            { hora_final: { [Op.gte]: horaFinalGenerada } }
                        ]
                    }
                ]
            }
        });

        if (conflictoDocente) {
            return res.status(400).json({ message: "El docente ya tiene asignada una clase en este horario" });
        }

        // 7. Generación de la sección automáticamente
        // Generar la sección a partir del último registro que coincida con la hora de inicio y clase
        const ultimaSeccion = await DetallePeriodo.findOne({
            include: [{
                model: CarreraClaseBloque,
                as: 'ccb',
                where: { id_clase }
            }],
            where: {
                id_periodo: periodo.id_periodo,
                hora_inicio: hora_inicio
            },
            order: [['seccion', 'DESC']]
        });

        const seccion = ultimaSeccion
            ? hora_inicio.slice(0, 2) + (parseInt(ultimaSeccion.seccion.slice(2), 10) + 1).toString().padStart(2, '0')
            : hora_inicio.slice(0, 2) + '01'; // Si no hay secciones previas, usar '01' como base

        // 8. Inserción de los registros con la sección generada
        const registrosInsertados = [];

        for (const bloque of bloques) {
            const detalle = await DetallePeriodo.create({
                id_periodo: periodo.id_periodo,
                id_ccb: bloque.id_ccb,
                docenteId,
                hora_inicio,
                hora_final: horaFinalGenerada,
                dia_inicio,
                dia_final,
                seccion: seccion // Usamos la sección generada aquí
            });
            registrosInsertados.push(detalle);
        }

        return res.status(201).json({ message: "Registros creados exitosamente", registros: registrosInsertados });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al procesar la solicitud", error });
    }
}