'use strict';

const db = require('../config/db');
const Periodo = db.periodos;
const DetallePeriodo = db.detalle_periodo;
const CarreraClaseBloque = db.carrera_clase_bloque;
const Clase = db.clases;
const { Op } = require('sequelize');

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

        // 4. Generar hora final
        let horaFinalGenerada;
        
        if (horario_especial === 1 && hora_final) {
            horaFinalGenerada = hora_final;
        } else {
            // Convertir hora_inicio (formato "HH:mm") a minutos
            const [horas, minutos] = hora_inicio.split(':').map(Number);
            let totalMinutos = horas * 60 + minutos;
            
            // Añadir minutos según el tipo de clase
            if ([1, 4].includes(clase.TipoClase)) {
                totalMinutos += 50;  // 50 minutos para tipos 1 y 4
            } else if ([2, 3].includes(clase.TipoClase)) {
                totalMinutos += 110; // 1 hora 50 minutos para tipos 2 y 3
            }
            
            // Convertir de vuelta a formato HH:mm
            const horasFinal = Math.floor(totalMinutos / 60);
            const minutosFinal = totalMinutos % 60;
            horaFinalGenerada = `${horasFinal.toString().padStart(2, '0')}:${minutosFinal.toString().padStart(2, '0')}`;
        }

        // 5. Validación mejorada de horarios por bloque
        for (const bloque of bloques) {
            // Buscar todas las clases que se dan en el mismo bloque
            const clasesEnBloque = await CarreraClaseBloque.findAll({
                attributes: ['id_clase'],
                where: {
                    id_ccb: bloque.id_ccb,
                    id_clase: { [Op.ne]: id_clase } // Excluimos la clase actual
                }
            });

            // Si hay otras clases en este bloque, verificar conflictos de horario
            if (clasesEnBloque.length > 0) {
                const idsClasesEnBloque = clasesEnBloque.map(cb => cb.id_clase);
                
                // Buscar si alguna de estas clases ya tiene un horario que coincida
                const conflicto = await DetallePeriodo.findOne({
                    include: [{
                        model: CarreraClaseBloque,
                        as: 'ccb',
                        where: {
                            id_clase: { [Op.in]: idsClasesEnBloque },
                            id_ccb: bloque.id_ccb
                        }
                    }],
                    where: {
                        id_periodo: periodo.id_periodo,
                        [Op.and]: [
                            // Validación de superposición de días
                            {
                                [Op.or]: [
                                    {
                                        [Op.and]: [
                                            { dia_inicio: { [Op.lte]: dia_inicio } },
                                            { dia_final: { [Op.gte]: dia_inicio } }
                                        ]
                                    },
                                    {
                                        [Op.and]: [
                                            { dia_inicio: { [Op.lte]: dia_final } },
                                            { dia_final: { [Op.gte]: dia_final } }
                                        ]
                                    },
                                    {
                                        [Op.and]: [
                                            { dia_inicio: { [Op.gte]: dia_inicio } },
                                            { dia_final: { [Op.lte]: dia_final } }
                                        ]
                                    }
                                ]
                            },
                            // Validación de superposición de horas
                            {
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
                                            { hora_inicio: { [Op.gte]: hora_inicio } },
                                            { hora_final: { [Op.lte]: horaFinalGenerada } }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                });

                if (conflicto) {
                    return res.status(400).json({
                        message: `Existe un choque de horario con otra clase en el bloque ${bloque.id_ccb} de la facultad ${bloque.facultadId}`,
                        id_ccb: bloque.id_ccb
                    });
                }
            }
        }

        // 6. Validación docente mejorada
        const conflictoDocente = await DetallePeriodo.findOne({
            where: {
                id_periodo: periodo.id_periodo,
                docenteId,
                [Op.and]: [
                    // Verifica superposición de días
                    {
                        [Op.or]: [
                            {
                                [Op.and]: [
                                    { dia_inicio: { [Op.lte]: dia_inicio } },
                                    { dia_final: { [Op.gte]: dia_inicio } }
                                ]
                            },
                            {
                                [Op.and]: [
                                    { dia_inicio: { [Op.lte]: dia_final } },
                                    { dia_final: { [Op.gte]: dia_final } }
                                ]
                            },
                            {
                                [Op.and]: [
                                    { dia_inicio: { [Op.gte]: dia_inicio } },
                                    { dia_final: { [Op.lte]: dia_final } }
                                ]
                            }
                        ]
                    },
                    // Verifica superposición de horas
                    {
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
                                    { hora_inicio: { [Op.gte]: hora_inicio } },
                                    { hora_final: { [Op.lte]: horaFinalGenerada } }
                                ]
                            }
                        ]
                    }
                ]
            }
        });

        if (conflictoDocente) {
            return res.status(400).json({ 
                message: "El docente ya tiene asignada una clase que se superpone en días y horarios con esta asignación"
            });
        }

        // 7. Generación de la sección automáticamente
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
            : hora_inicio.slice(0, 2) + '01';

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
                seccion: seccion
            });
            registrosInsertados.push(detalle);
        }

        return res.status(201).json({ message: "Registros creados exitosamente", registros: registrosInsertados });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al procesar la solicitud", error });
    }
}