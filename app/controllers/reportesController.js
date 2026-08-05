'use strict';

const db = require('../config/db');
const Sequelize = require('sequelize');
const {
    generarPDFDocentes,
    generarPDFTernas,
    generarPDFClases,
    labelRol,
    labelEstadoTerna,
    DIAS,
} = require('../services/ReportePdfService');

const Docente = db.docente;
const Facultad = db.facultad;
const Terna = db.terna;
const DetalleTerna = db.detalleTerna;
const Alumno = db.alumno;
const DetallePeriodo = db.detalle_periodo;
const CarreraClaseBloque = db.carrera_clase_bloque;
const Clases = db.clases;
const Periodo = db.periodos;

const ROLES_REQUERIDOS = ['coordina', 'estilo', 'tecnico'];

module.exports = {
    generarReporteDocentes,
    generarReporteTernas,
    generarReporteClases,
};

function formatHora(hora) {
    return hora ? String(hora).slice(0, 5) : '';
}

async function obtenerPeriodoActual() {
    const periodos = await Periodo.findAll({ order: [['fecha_inicio', 'ASC']] });
    return periodos.length > 0 ? periodos[periodos.length - 1].id_periodo : null;
}

// Mismo patrón que clasesDocenteController.findAll, pero sin filtrar por un solo docenteId
async function obtenerSeccionesDelPeriodo(idPeriodo) {
    if (!idPeriodo) return [];
    return DetallePeriodo.findAll({
        where: { id_periodo: idPeriodo },
        attributes: [
            'seccion',
            'docenteId',
            'id_periodo',
            'hora_inicio',
            'dia_inicio',
            'dia_final',
            'hora_final',
            [Sequelize.literal('`ccb`.`id_clase`'), 'id_clase'],
        ],
        include: [
            {
                model: CarreraClaseBloque,
                as: 'ccb',
                attributes: [],
            },
        ],
        group: [
            'seccion', 'docenteId', 'id_periodo',
            'hora_inicio', 'dia_inicio', 'dia_final', 'hora_final',
            'ccb.id_clase',
        ],
    });
}

// GET /api/reportes/docentes
async function generarReporteDocentes(req, res) {
    try {
        const idPeriodo = req.query.id_periodo || await obtenerPeriodoActual();

        const [docentes, secciones, clases, detallesTerna] = await Promise.all([
            Docente.findAll({ where: { estadoDocente: 1 }, include: [{ model: Facultad }] }),
            obtenerSeccionesDelPeriodo(idPeriodo),
            Clases.findAll(),
            DetalleTerna.findAll({
                include: [{ model: Docente }, { model: Terna, include: [{ model: Alumno }] }],
            }),
        ]);

        const nombreClasePorId = new Map(clases.map(c => [c.id_clase, c.nombre_clase]));

        const docentesConCarga = docentes.map(docente => {
            const seccionesDocente = secciones.filter(s => s.docenteId === docente.docenteId);
            const carga = seccionesDocente.map(s => ({
                clase: nombreClasePorId.get(s.get('id_clase')) || 'N/D',
                seccion: s.seccion,
                dias: `${DIAS[s.dia_inicio] || ''} - ${DIAS[s.dia_final] || ''}`,
                horario: `${formatHora(s.hora_inicio)} - ${formatHora(s.hora_final)}`,
            }));

            const ternasDelDocente = detallesTerna.filter(dt => dt.docenteId === docente.docenteId);
            const ternasDetalle = ternasDelDocente.map(dt => ({
                alumno: dt.terna?.alumno?.nombre || 'N/D',
                rol: labelRol(dt.rol),
                estado: labelEstadoTerna(dt.terna?.idEstadoTerna),
            }));

            return {
                docenteId: docente.docenteId,
                nombre: docente.nombre,
                email: docente.email,
                telefono: docente.telefono,
                facultad: docente.facultad?.nombre || docente.facultadId,
                carga,
                ternasDetalle,
            };
        });

        const doc = generarPDFDocentes(docentesConCarga);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="reporte-docentes.pdf"');
        doc.pipe(res);
        doc.end();
    } catch (error) {
        console.error('Error generando reporte de docentes:', error);
        res.status(500).send({ message: error.message || 'Error al generar el reporte de docentes.' });
    }
}

// GET /api/reportes/ternas
async function generarReporteTernas(req, res) {
    try {
        const ternas = await Terna.findAll({
            include: [
                { model: Alumno },
                { model: DetalleTerna, include: [{ model: Docente }] },
            ],
        });

        const ternasFormateadas = ternas.map(t => {
            const rolesPresentes = new Set((t.detalleTernas || []).map(dt => dt.rol));
            const ternaCompleta = ROLES_REQUERIDOS.every(rol => rolesPresentes.has(rol));

            return {
                ternaId: t.ternaId,
                alumnoNombre: t.alumno?.nombre || 'N/D',
                alumnoEmail: t.alumno?.email || 'N/D',
                alumnoTelefono: t.alumno?.telefono,
                estado: labelEstadoTerna(t.idEstadoTerna),
                ternaCompleta,
                docentes: (t.detalleTernas || []).map(dt => ({
                    nombre: dt.docente?.nombre || 'N/D',
                    rol: labelRol(dt.rol),
                })),
            };
        });

        const doc = generarPDFTernas(ternasFormateadas);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="reporte-ternas.pdf"');
        doc.pipe(res);
        doc.end();
    } catch (error) {
        console.error('Error generando reporte de ternas:', error);
        res.status(500).send({ message: error.message || 'Error al generar el reporte de ternas.' });
    }
}

// GET /api/reportes/clases
async function generarReporteClases(req, res) {
    try {
        const facultadId = req.query.facultadId;
        const aperturada = req.query.aperturada; // 'todas' | 'si' | 'no'
        const idPeriodo = req.query.id_periodo || await obtenerPeriodoActual();

        const ccbWhere = {};
        if (facultadId) ccbWhere.facultadId = facultadId;
        const ccbRows = await CarreraClaseBloque.findAll({ where: ccbWhere });
        const idClases = [...new Set(ccbRows.map(c => c.id_clase))];

        const [clases, secciones, facultad] = await Promise.all([
            Clases.findAll({
                where: {
                    estado: 1,
                    id_clase: { [Sequelize.Op.in]: idClases.length ? idClases : [''] },
                },
            }),
            obtenerSeccionesDelPeriodo(idPeriodo),
            facultadId ? Facultad.findByPk(facultadId) : null,
        ]);

        const idClasesAperturadas = new Set(secciones.map(s => s.get('id_clase')));

        let clasesFormateadas = clases.map(c => ({
            id_clase: c.id_clase,
            nombre_clase: c.nombre_clase,
            creditos: c.creditos,
            aperturada: idClasesAperturadas.has(c.id_clase),
        }));

        if (aperturada === 'si') {
            clasesFormateadas = clasesFormateadas.filter(c => c.aperturada);
        } else if (aperturada === 'no') {
            clasesFormateadas = clasesFormateadas.filter(c => !c.aperturada);
        }

        const doc = generarPDFClases(clasesFormateadas, facultad?.nombreFacultad, idPeriodo);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="reporte-clases.pdf"');
        doc.pipe(res);
        doc.end();
    } catch (error) {
        console.error('Error generando reporte de clases:', error);
        res.status(500).send({ message: error.message || 'Error al generar el reporte de clases.' });
    }
}