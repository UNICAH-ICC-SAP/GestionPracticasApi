'use strict';

const db = require('../config/db');
const Periodo = db.periodos;
const DetallePeriodo = db.detalle_periodo;
const CarreraClaseBloque = db.carrera_clase_bloque;
const Clase = db.clases;
const { Op } = require('sequelize');

module.exports = {
    insert,
    update,
    deleteSection
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
            attributes: ['id_ccb', 'facultadId', 'id_bloque'],  // Añadir id_bloque aquí
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

// 5. Validaciones de horarios por bloque de clase
for (const bloque of bloques) {
    const conflicto = await DetallePeriodo.findOne({
        include: [{
            model: CarreraClaseBloque,
            as: 'ccb',
            where: {
                facultadId: bloque.facultadId,
                id_bloque: bloque.id_bloque,
                id_clase: { [Op.ne]: id_clase } // Excluir la misma clase
            }
        }],
        where: {
            id_periodo: periodo.id_periodo,
            [Op.and]: [
                // Verificar traslape de días
                { 
                    dia_inicio: { [Op.lte]: dia_final },
                    dia_final: { [Op.gte]: dia_inicio }
                },
                // Verificar traslape de horas
                {
                    hora_inicio: { [Op.lt]: horaFinalGenerada },
                    hora_final: { [Op.gt]: hora_inicio }
                }
            ]
        }
    });

    if (conflicto) {
        return res.status(400).json({
            message: `Ya existe una clase registrada en el bloque ${bloque.id_bloque} para la facultad ${bloque.facultadId} en este horario`,
            id_ccb: bloque.id_ccb
        });
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

async function update(req, res) {
    try {
        const { 
            id_clase, hora_inicio, hora_final, docenteId, 
            dia_inicio, dia_final, horario_especial, seccion 
        } = req.body;

        // Validaciones de parámetros requeridos
        if (!seccion) {
            return res.status(400).json({ message: "La sección es requerida para actualizar" });
        }

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

        // 3. Obtener los detalles de período existentes para esta sección y clase
        const detallesExistentes = await DetallePeriodo.findAll({
            include: [{
                model: CarreraClaseBloque,
                as: 'ccb',
                where: { id_clase }
            }],
            where: {
                id_periodo: periodo.id_periodo,
                seccion: seccion
            }
        });

        if (!detallesExistentes || detallesExistentes.length === 0) {
            return res.status(404).json({ message: "No se encontraron registros para actualizar" });
        }

        // 4. Generar hora final
        let horaFinalGenerada;
        
        if (horario_especial === 1 && hora_final) {
            horaFinalGenerada = hora_final;
        } else {
            const [horas, minutos] = hora_inicio.split(':').map(Number);
            let totalMinutos = horas * 60 + minutos;
            
            if ([1, 4].includes(clase.TipoClase)) {
                totalMinutos += 50;
            } else if ([2, 3].includes(clase.TipoClase)) {
                totalMinutos += 110;
            }
            
            const horasFinal = Math.floor(totalMinutos / 60);
            const minutosFinal = totalMinutos % 60;
            horaFinalGenerada = `${horasFinal.toString().padStart(2, '0')}:${minutosFinal.toString().padStart(2, '0')}`;
        }

        // 5. Validaciones de horarios por bloque de clase
        for (const detalle of detallesExistentes) {
            const bloque = await CarreraClaseBloque.findOne({
                where: { 
                    id_ccb: detalle.id_ccb,
                    id_clase: id_clase 
                }
            });

            const conflicto = await DetallePeriodo.findOne({
                include: [{
                    model: CarreraClaseBloque,
                    as: 'ccb',
                    where: {
                        facultadId: bloque.facultadId,
                        id_bloque: bloque.id_bloque,
                        id_clase: { [Op.ne]: id_clase }
                    }
                }],
                where: {
                    id_periodo: periodo.id_periodo,
                    [Op.and]: [
                        { 
                            dia_inicio: { [Op.lte]: dia_final },
                            dia_final: { [Op.gte]: dia_inicio }
                        },
                        {
                            hora_inicio: { [Op.lt]: horaFinalGenerada },
                            hora_final: { [Op.gt]: hora_inicio }
                        }
                    ]
                }
            });

            if (conflicto) {
                return res.status(400).json({
                    message: `Ya existe una clase registrada en el bloque ${bloque.id_bloque} para la facultad ${bloque.facultadId} en este horario`,
                    id_ccb: bloque.id_ccb
                });
            }
        }

        // 6. Validación docente - Modificada para verificar cambios de docente y hora
        const docenteActual = detallesExistentes[0].docenteId;
        const horaInicioActual = detallesExistentes[0].hora_inicio.padStart(5, '0');
        const horaInicioNueva = hora_inicio.padStart(5, '0');
        
        // Validamos si hay cambio de docente o cambio de hora
        const requiereValidacion = docenteId !== docenteActual || horaInicioNueva !== horaInicioActual;

        if (requiereValidacion) {
            const conflictoDocente = await DetallePeriodo.findOne({
                where: {
                    id_periodo: periodo.id_periodo,
                    docenteId,
                    id_detalle: { [Op.notIn]: detallesExistentes.map(d => d.id_detalle) },
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
        }

        // 7. Manejo de sección
        let nuevaSeccion = seccion; // Por defecto mantiene la sección original

        // Solo si la hora de inicio cambió, necesitamos generar una nueva sección
        const horaInicioFormateada = hora_inicio.padStart(5, '0');
        const horaInicioOriginal = detallesExistentes[0].hora_inicio.padStart(5, '0');

        if (horaInicioFormateada !== horaInicioOriginal) {
            // Si la hora cambió, generamos una nueva sección
            nuevaSeccion = horaInicioFormateada.slice(0, 2) + '01';

            // Buscar si ya existen secciones para esta hora y clase
            const seccionesExistentes = await DetallePeriodo.findAll({
                include: [{
                    model: CarreraClaseBloque,
                    as: 'ccb',
                    where: { id_clase }
                }],
                where: {
                    id_periodo: periodo.id_periodo,
                    hora_inicio: horaInicioFormateada,
                    id_detalle: { 
                        [Op.notIn]: detallesExistentes.map(d => d.id_detalle) 
                    }
                },
                order: [['seccion', 'DESC']]
            });

            if (seccionesExistentes && seccionesExistentes.length > 0) {
                // Si hay secciones existentes, tomar la última y aumentar
                const ultimaSeccion = seccionesExistentes[0];
                const numeroSeccion = parseInt(ultimaSeccion.seccion.slice(2), 10) + 1;
                nuevaSeccion = horaInicioFormateada.slice(0, 2) + numeroSeccion.toString().padStart(2, '0');
            }
        }

        // 8. Actualización de registros
        const registrosActualizados = [];

        for (const detalle of detallesExistentes) {
            detalle.docenteId = docenteId;
            detalle.hora_inicio = hora_inicio;
            detalle.hora_final = horaFinalGenerada;
            detalle.dia_inicio = dia_inicio;
            detalle.dia_final = dia_final;
            detalle.seccion = nuevaSeccion;

            await detalle.save();
            registrosActualizados.push(detalle);
        }

        return res.status(200).json({ 
            message: "Registros actualizados exitosamente", 
            registros: registrosActualizados 
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al procesar la solicitud", error });
    }
}

async function deleteSection(req, res) {
    try {
        const { id_clase, seccion } = req.body;

        // Validar parámetros requeridos
        if (!id_clase || !seccion) {
            return res.status(400).json({ 
                message: "Se requieren id_clase y seccion para realizar la eliminación" 
            });
        }

        // 1. Obtener el periodo actual
        const periodo = await Periodo.findOne({
            attributes: ['id_periodo'],
            order: [['fecha_final', 'DESC']],
            limit: 1
        });

        if (!periodo) {
            return res.status(400).json({ message: "No se encontró el periodo actual" });
        }

        // 2. Buscar los registros a eliminar
        const registrosAEliminar = await DetallePeriodo.findAll({
            include: [{
                model: CarreraClaseBloque,
                as: 'ccb',
                where: { id_clase }
            }],
            where: {
                id_periodo: periodo.id_periodo,
                seccion: seccion
            }
        });

        if (!registrosAEliminar || registrosAEliminar.length === 0) {
            return res.status(404).json({ 
                message: "No se encontraron registros para eliminar con la sección especificada" 
            });
        }

        // 3. Eliminar los registros
        const idsAEliminar = registrosAEliminar.map(registro => registro.id_detalle);
        await DetallePeriodo.destroy({
            where: {
                id_detalle: idsAEliminar
            }
        });

        return res.status(200).json({ 
            message: "Registros eliminados exitosamente",
            registrosEliminados: registrosAEliminar.length
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ 
            message: "Error al procesar la solicitud de eliminación", 
            error 
        });
    }
}