'use strict';

const PDFDocument = require('pdfkit');

const AZUL = '#0b3d91';
const AZUL_CLARO = '#eef2fb';
const GRIS_TEXTO = '#333333';
const GRIS_BORDE = '#dddddd';
const VERDE = '#1e7e34';
const ROJO = '#b02a37';

const MARGEN = 50;

const DIAS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const ESTADOS_TERNA = {
    1: 'Inactiva',
    2: 'En Curso',
    3: 'Revisión Monografía',
    4: 'Agendada',
    5: 'Finalizada',
};

const ROLES_DOCENTE = {
    coordina: 'Coordinador',
    estilo: 'Revisor de Estilos',
};

function labelRol(rol) {
    return ROLES_DOCENTE[rol] || 'Revisor Técnico';
}

function labelEstadoTerna(idEstadoTerna) {
    return ESTADOS_TERNA[idEstadoTerna] || 'Desconocido';
}

// --- Utilidades de dibujo ---

function dibujarMarco(doc) {
    const { width, height } = doc.page;
    doc.save();
    doc.lineWidth(3);
    doc.strokeColor(AZUL);
    doc.rect(20, 20, width - 40, height - 40).stroke();
    doc.lineWidth(0.75);
    doc.rect(26, 26, width - 52, height - 52).stroke();
    doc.restore();
}

function dibujarSeparador(doc) {
    doc.moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .strokeColor(GRIS_BORDE)
        .lineWidth(0.5)
        .stroke();
    doc.moveDown(0.5);
}

function dibujarEncabezado(doc, titulo) {
    const fecha = new Date().toLocaleDateString('es-HN', { year: 'numeric', month: 'long', day: 'numeric' });

    doc.fillColor(AZUL)
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('UNICAH - Gestión de Prácticas', { align: 'center' });

    doc.fontSize(13)
        .font('Helvetica-Bold')
        .fillColor(GRIS_TEXTO)
        .text(titulo, { align: 'center' });

    doc.fontSize(9)
        .font('Helvetica')
        .fillColor(GRIS_TEXTO)
        .text(`Generado el ${fecha}`, { align: 'center' });

    doc.moveDown(1);
    dibujarSeparador(doc);
    doc.moveDown(0.3);
}

function dibujarPiePaginaYMarco(doc) {
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        dibujarMarco(doc);

        const { width, height, margins } = doc.page;
        // El texto va por debajo del margen inferior (es el pie de página), así que
        // se anula temporalmente el margen: si no, pdfkit cree que no cabe y agrega
        // una página en blanco extra por cada página del documento.
        const margenInferiorOriginal = margins.bottom;
        doc.page.margins.bottom = 0;
        doc.fontSize(8)
            .font('Helvetica')
            .fillColor(GRIS_TEXTO)
            .text(`Página ${i + 1} de ${range.count}`, margins.left, height - 35, {
                width: width - margins.left - margins.right,
                align: 'center',
            });
        doc.page.margins.bottom = margenInferiorOriginal;
    }
}

function nuevoDocumento() {
    return new PDFDocument({ size: 'letter', margin: MARGEN, bufferPages: true });
}

function asegurarEspacio(doc, alturaNecesaria) {
    const limite = doc.page.height - doc.page.margins.bottom;
    if (doc.y + alturaNecesaria > limite) {
        doc.addPage();
    }
}

function dibujarTitulo(doc, texto) {
    asegurarEspacio(doc, 24);
    doc.fontSize(11)
        .font('Helvetica-Bold')
        .fillColor(AZUL)
        .text(texto);
    doc.moveDown(0.3);
    doc.fillColor(GRIS_TEXTO);
}

// Tabla simple dibujada a mano (pdfkit no trae soporte de tablas nativo)
function dibujarTabla(doc, columnas, filas) {
    const alturaFila = 18;
    const x0 = doc.page.margins.left;
    const anchoTotal = columnas.reduce((s, c) => s + c.width, 0);

    const dibujarEncabezadoTabla = () => {
        asegurarEspacio(doc, alturaFila + 4);
        const y = doc.y;
        doc.rect(x0, y, anchoTotal, alturaFila).fill(AZUL);
        let x = x0;
        doc.font('Helvetica-Bold').fontSize(9);
        columnas.forEach(col => {
            doc.fillColor('#ffffff').text(col.label, x + 4, y + 5, { width: col.width - 8, ellipsis: true });
            x += col.width;
        });
        doc.y = y + alturaFila;
        doc.fillColor(GRIS_TEXTO).font('Helvetica').fontSize(9);
    };

    dibujarEncabezadoTabla();

    if (!filas || filas.length === 0) {
        asegurarEspacio(doc, alturaFila);
        doc.font('Helvetica-Oblique').fontSize(9).fillColor(GRIS_TEXTO)
            .text('Sin registros', x0 + 4, doc.y + 4);
        doc.moveDown(1.2);
        return;
    }

    filas.forEach((fila, idx) => {
        if (doc.y + alturaFila > doc.page.height - doc.page.margins.bottom) {
            doc.addPage();
            dibujarEncabezadoTabla();
        }
        const y = doc.y;
        if (idx % 2 === 1) {
            doc.rect(x0, y, anchoTotal, alturaFila).fill(AZUL_CLARO);
        }
        let x = x0;
        doc.font('Helvetica').fontSize(9);
        columnas.forEach(col => {
            doc.fillColor(GRIS_TEXTO).text(String(fila[col.key] ?? ''), x + 4, y + 5, { width: col.width - 8, ellipsis: true });
            x += col.width;
        });
        doc.y = y + alturaFila;
    });

    doc.moveDown(0.8);
}

// GET /api/reportes/docentes
function generarPDFDocentes(docentes) {
    const doc = nuevoDocumento();
    dibujarEncabezado(doc, 'Reporte de Docentes');

    if (!docentes || docentes.length === 0) {
        doc.font('Helvetica-Oblique').fontSize(10).text('No hay docentes activos registrados.');
    } else {
        docentes.forEach((docente, idx) => {
            const sinDatos = docente.carga.length === 0 && docente.ternasDetalle.length === 0;
            asegurarEspacio(doc, sinDatos ? 40 : 60);

            doc.font('Helvetica-Bold').fontSize(12).fillColor(AZUL)
                .text(docente.nombre || 'N/D');
            doc.font('Helvetica').fontSize(9).fillColor(GRIS_TEXTO)
                .text(`Facultad: ${docente.facultad || 'N/D'}    Email: ${docente.email || 'N/D'}    Teléfono: ${docente.telefono || 'N/D'}`);

            if (sinDatos) {
                doc.font('Helvetica-Oblique').fontSize(9).fillColor(GRIS_TEXTO)
                    .text('Sin carga académica ni ternas asignadas este periodo.');
                doc.moveDown(0.4);
            } else {
                doc.moveDown(0.4);

                if (docente.carga.length > 0) {
                    dibujarTitulo(doc, 'Carga académica');
                    dibujarTabla(doc, [
                        { key: 'clase', label: 'Clase', width: 160 },
                        { key: 'seccion', label: 'Sección', width: 70 },
                        { key: 'dias', label: 'Días', width: 140 },
                        { key: 'horario', label: 'Horario', width: 142 },
                    ], docente.carga);
                }

                if (docente.ternasDetalle.length > 0) {
                    dibujarTitulo(doc, 'Ternas asignadas');
                    dibujarTabla(doc, [
                        { key: 'alumno', label: 'Alumno', width: 220 },
                        { key: 'rol', label: 'Rol', width: 140 },
                        { key: 'estado', label: 'Estado', width: 152 },
                    ], docente.ternasDetalle);
                }
            }

            if (idx < docentes.length - 1) {
                dibujarSeparador(doc);
                doc.moveDown(0.4);
            }
        });
    }

    dibujarPiePaginaYMarco(doc);
    return doc;
}

// GET /api/reportes/ternas
function generarPDFTernas(ternas) {
    const doc = nuevoDocumento();
    dibujarEncabezado(doc, 'Reporte de Ternas');

    if (!ternas || ternas.length === 0) {
        doc.font('Helvetica-Oblique').fontSize(10).text('No hay ternas registradas.');
    } else {
        ternas.forEach((terna, idx) => {
            asegurarEspacio(doc, 60);

            doc.font('Helvetica-Bold').fontSize(12).fillColor(AZUL)
                .text(terna.alumnoNombre || 'N/D');
            doc.font('Helvetica').fontSize(9).fillColor(GRIS_TEXTO)
                .text(`Email: ${terna.alumnoEmail || 'N/D'}    Teléfono: ${terna.alumnoTelefono || 'N/D'}    Estado: ${terna.estado || 'N/D'}`);
            doc.font('Helvetica-Bold').fontSize(9).fillColor(terna.ternaCompleta ? VERDE : ROJO)
                .text(terna.ternaCompleta ? 'Terna completa' : 'Terna incompleta');
            doc.fillColor(GRIS_TEXTO);
            doc.moveDown(0.4);

            dibujarTitulo(doc, 'Docentes asignados');
            dibujarTabla(doc, [
                { key: 'nombre', label: 'Nombre', width: 300 },
                { key: 'rol', label: 'Rol', width: 212 },
            ], terna.docentes);

            if (idx < ternas.length - 1) {
                dibujarSeparador(doc);
                doc.moveDown(0.4);
            }
        });
    }

    dibujarPiePaginaYMarco(doc);
    return doc;
}

// GET /api/reportes/clases
function generarPDFClases(clases, facultadNombre, idPeriodo) {
    const doc = nuevoDocumento();
    dibujarEncabezado(doc, 'Reporte de Clases');

    doc.font('Helvetica').fontSize(9).fillColor(GRIS_TEXTO)
        .text(`Facultad: ${facultadNombre || 'Todas'}    Periodo: ${idPeriodo || 'N/D'}`);
    doc.moveDown(0.4);

    dibujarTabla(doc, [
        { key: 'id_clase', label: 'Código', width: 90 },
        { key: 'nombre_clase', label: 'Nombre', width: 260 },
        { key: 'creditos', label: 'Créditos', width: 70 },
        { key: 'estado', label: 'Estado', width: 92 },
    ], clases.map(c => ({ ...c, estado: c.aperturada ? 'Aperturada' : 'No aperturada' })));

    dibujarPiePaginaYMarco(doc);
    return doc;
}

module.exports = {
    generarPDFDocentes,
    generarPDFTernas,
    generarPDFClases,
    labelRol,
    labelEstadoTerna,
    DIAS,
};
