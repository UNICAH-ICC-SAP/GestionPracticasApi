'use strict';

const db = require('../config/db');
const { DAYS, COLUMNS, normalize } = require('./cargaImportParser');

function validDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
        !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

function dateRange(record, period) {
    const match = /\[SAP (\d{4}-\d{2}-\d{2}) (\d{4}-\d{2}-\d{2})\]/.exec(record.observacion || '');
    return match ? match.slice(1) : [String(period.fecha_inicio).slice(0, 10), String(period.fecha_final).slice(0, 10)];
}

function dateString(value) {
    return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
}

function sameSchedule(a, b) {
    return ['id_ccb', 'docenteId', 'seccion', 'dia_inicio', 'dia_final'].every(key => String(a[key]) === String(b[key])) &&
        a.hora_inicio.slice(0, 5) === b.hora_inicio.slice(0, 5) && a.hora_final.slice(0, 5) === b.hora_final.slice(0, 5);
}

async function prepare(rows, id_periodo, facultadId, transaction) {
    if (!Array.isArray(rows) || !rows.length || rows.length > 3000 ||
        typeof id_periodo !== 'string' || typeof facultadId !== 'string' || !facultadId) {
        throw { status: 400, message: 'Selecciona período, carrera y entre 1 y 3000 clases.' };
    }
    const period = await db.periodos.findByPk(id_periodo, {
        transaction, ...(transaction ? { lock: transaction.LOCK.UPDATE } : {})
    });
    if (!period) throw { status: 400, message: 'El período seleccionado no existe.' };
    const [teachers, blocks, courses, existing] = await Promise.all([
        db.docente.findAll({ attributes: ['docenteId', 'nombre', 'estadoDocente'], transaction }),
        db.carrera_clase_bloque.findAll({ where: { facultadId }, transaction }),
        db.clases.findAll({ attributes: ['id_clase', 'nombre_clase'], transaction }),
        db.detalle_periodo.findAll({ where: { id_periodo }, transaction })
    ]);
    const teacherMap = new Map(teachers.map(teacher => [String(teacher.docenteId), teacher]));
    const courseMap = new Map(courses.map(course => [normalize(course.id_clase), course]));
    const allBlocks = await db.carrera_clase_bloque.findAll({ transaction });
    const blockMap = new Map(allBlocks.map(block => [String(block.id_ccb), block]));
    const periodRange = { fecha_inicio: dateString(period.fecha_inicio), fecha_final: dateString(period.fecha_final) };
    const records = existing.map(record => record.get ? record.get({ plain: true }) : record);
    const pending = [];
    const output = [];
    let duplicates = 0;

    for (const [index, source] of rows.entries()) {
        if (!source || typeof source !== 'object' || Array.isArray(source)) {
            throw { status: 400, message: 'El contenido de las filas no es válido.' };
        }
        const row = Object.fromEntries(COLUMNS.map(key => [key, String(source[key] ?? '').trim()]));
        const errors = [];
        const warnings = [];
        const code = normalize(row.codigo).split('-').pop();
        const teacher = teacherMap.get(row.docenteId);
        const course = courseMap.get(code);
        const matching = blocks.filter(block => normalize(block.id_clase) === code);
        const days = normalize(row.dias).split(/[\s,;]+/).filter(Boolean);
        if (Object.values(row).some(value => value.length > 1000)) errors.push('Una celda supera los 1000 caracteres.');
        if (!teacher || Number(teacher.estadoDocente) !== 1) errors.push('Docente inexistente o inactivo.');
        if (teacher && row.nombre_docente && normalize(row.nombre_docente) !== normalize(teacher.nombre)) {
            warnings.push(`Nombre en catálogo: ${teacher.nombre}. Se utiliza el identificador ${row.docenteId}.`);
        }
        if (!course || !matching.length) errors.push('Asignatura sin bloque en la carrera seleccionada.');
        if (matching.length > 1) warnings.push(`Se crearán horarios en ${matching.length} bloques de la carrera.`);
        if (course && row.nombre_clase && normalize(row.nombre_clase) !== normalize(course.nombre_clase)) {
            warnings.push(`Asignatura en catálogo: ${course.nombre_clase}.`);
        }
        if (!/^[A-Za-z0-9-]{1,10}$/.test(row.seccion)) errors.push('Sección requerida, máximo 10 caracteres.');
        if (![row.hora_inicio, row.hora_final].every(time => /^([01]\d|2[0-3]):[0-5]\d$/.test(time)) ||
            row.hora_inicio >= row.hora_final) errors.push('El horario no es válido. Usa HH:mm y hora final posterior.');
        if (!days.length || days.some(day => !DAYS.includes(day))) errors.push('Días válidos: LUN MAR MIE JUE VIE SAB DOM.');
        if (![row.fecha_inicio, row.fecha_final].every(validDate) || row.fecha_inicio > row.fecha_final ||
            row.fecha_inicio < periodRange.fecha_inicio || row.fecha_final > periodRange.fecha_final) {
            errors.push('Las fechas deben ser válidas y estar dentro del período seleccionado.');
        }
        if (!errors.length) {
            const generated = [];
            for (const block of matching) {
                for (const day of new Set(days)) {
                    // La aplicación usa 1=lunes ... 6=sábado. Domingo no se representa en sus calendarios.
                    if (day === 'DOM') {
                        errors.push('Los calendarios actuales no admiten domingo.');
                        continue;
                    }
                    const record = {
                        id_periodo, id_ccb: block.id_ccb, docenteId: row.docenteId, seccion: row.seccion,
                        hora_inicio: row.hora_inicio, hora_final: row.hora_final,
                        dia_inicio: DAYS.indexOf(day) + 1, dia_final: DAYS.indexOf(day) + 1,
                        observacion: `[SAP ${row.fecha_inicio} ${row.fecha_final}] Campus: ${row.campus || 'Sin indicar'}. ${row.observacion}`
                    };
                    const sameDates = candidate => {
                        const range = dateRange(candidate, periodRange);
                        return range[0] === row.fecha_inicio && range[1] === row.fecha_final;
                    };
                    if ([...records, ...pending, ...generated].some(candidate => sameSchedule(candidate, record) && sameDates(candidate))) {
                        duplicates++;
                        continue;
                    }
                    const conflict = [...records, ...pending, ...generated].find(candidate => {
                        const range = dateRange(candidate, periodRange);
                        if (row.fecha_final < range[0] || row.fecha_inicio > range[1] ||
                            record.dia_inicio < candidate.dia_inicio || record.dia_inicio > candidate.dia_final ||
                            record.hora_inicio >= candidate.hora_final.slice(0, 5) || record.hora_final <= candidate.hora_inicio.slice(0, 5)) return false;
                        const otherBlock = blockMap.get(String(candidate.id_ccb));
                        // La misma sección puede estar asociada a varios bloques del pensum.
                        const sameClassSection = otherBlock && normalize(otherBlock.id_clase) === code &&
                            candidate.seccion === record.seccion && candidate.docenteId === record.docenteId &&
                            candidate.hora_inicio.slice(0, 5) === record.hora_inicio && candidate.hora_final.slice(0, 5) === record.hora_final;
                        if (sameClassSection) return false;
                        return String(candidate.docenteId) === record.docenteId ||
                            (otherBlock && otherBlock.facultadId === block.facultadId && otherBlock.id_bloque === block.id_bloque);
                    });
                    if (conflict) errors.push(`Conflicto de docente o bloque el ${day} a las ${row.hora_inicio}.`);
                    generated.push(record);
                }
            }
            if (!errors.length) pending.push(...generated);
        }
        output.push({ ...row, fila: index + 1, errores: [...new Set(errors)], advertencias: warnings });
    }
    return { filas: output, registros: pending, duplicados: duplicates };
}

async function confirm(rows, id_periodo, facultadId) {
    return db.sequelize.transaction({ isolationLevel: db.Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE }, async transaction => {
        const result = await prepare(rows, id_periodo, facultadId, transaction);
        if (result.filas.some(row => row.errores.length)) {
            throw { status: 409, message: 'La carga contiene errores. Actualiza la vista previa antes de importar.', filas: result.filas };
        }
        if (result.registros.length) {
            await db.detalle_periodo.bulkCreate(result.registros, { transaction, validate: true, fields: [
                'id_periodo', 'id_ccb', 'docenteId', 'seccion', 'hora_inicio', 'hora_final', 'dia_inicio', 'dia_final', 'observacion'
            ] });
        }
        return { insertados: result.registros.length, duplicados: result.duplicados };
    });
}

module.exports = { prepare, confirm };
