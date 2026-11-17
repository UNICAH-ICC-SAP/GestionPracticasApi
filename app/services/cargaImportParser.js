'use strict';

const ExcelJS = require('exceljs');

const DAYS = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'];
const COLUMNS = ['docenteId', 'nombre_docente', 'codigo', 'nombre_clase', 'seccion',
    'fecha_inicio', 'fecha_final', 'hora_inicio', 'hora_final', 'dias', 'campus', 'observacion'];

function normalize(value) {
    return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .trim().toUpperCase();
}

function parseSapText(text) {
    const lines = text.replace(/\r/g, '').split('\n').map(line => line.trim()).filter(Boolean);
    const rows = [];
    let teacher;
    let row;
    for (const line of lines) {
        const heading = /^#\s*\d+\s*-\s*(\d+)\s*:\s*(.+)$/.exec(line);
        if (heading) {
            teacher = { docenteId: heading[1], nombre_docente: heading[2] };
            row = undefined;
            continue;
        }
        const course = /^([A-Z0-9]+-[A-Z0-9]+)\s+-\s+(.+)$/i.exec(line);
        if (course && teacher) {
            row = { ...teacher, codigo: course[1], nombre_clase: course[2] };
            rows.push(row);
        }
        if (!row) continue;
        const section = /Secci[oó]n:\s*([^\s]+?)(?=Estado:|\s|$)/i.exec(line);
        const dates = /Fechas:\s*(\d{4}-\d{2}-\d{2})\s*-\s*(\d{4}-\d{2}-\d{2})/.exec(line);
        const hours = /Hora:\s*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/.exec(line);
        const days = /D[ií]as:\s*(.*)/i.exec(line);
        const campus = /Campus:\s*(.*)/i.exec(line);
        const observation = /Observaci[oó]n:\s*(.*)/i.exec(line);
        if (section) row.seccion = section[1];
        if (dates) [row.fecha_inicio, row.fecha_final] = dates.slice(1);
        if (hours) [row.hora_inicio, row.hora_final] = hours.slice(1).map(time => time.padStart(5, '0'));
        if (days) row.dias = DAYS.filter(day => normalize(days[1]).split(/\s+/).includes(day)).join(' ');
        if (campus) row.campus = campus[1];
        if (observation) row.observacion = observation[1];
    }
    return rows;
}

function cellText(cell, key) {
    if (cell.value instanceof Date) {
        return key && key.startsWith('hora_')
            ? cell.value.toISOString().slice(11, 16)
            : cell.value.toISOString().slice(0, 10);
    }
    if (key && key.startsWith('hora_')) {
        if (typeof cell.value === 'number' && cell.value >= 0 && cell.value < 1) {
            const minutes = Math.round(cell.value * 24 * 60);
            return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
        }
        if (/^\d{1,2}:\d{2}$/.test(cell.text.trim())) return cell.text.trim().padStart(5, '0');
    }
    return cell.text.trim();
}

async function readFile(fileName, base64) {
    if (typeof fileName !== 'string' || typeof base64 !== 'string' ||
        base64.length > 14 * 1024 * 1024 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
        throw new Error('El archivo no es válido o supera los 10 MB.');
    }
    const buffer = Buffer.from(base64, 'base64');
    if (!buffer.length || buffer.length > 10 * 1024 * 1024) throw new Error('El archivo supera los 10 MB.');
    let rows;
    if (/\.pdf$/i.test(fileName) && buffer.subarray(0, 5).toString() === '%PDF-') {
        const { PDFParse } = require('pdf-parse');
        const parser = new PDFParse({ data: buffer, isEvalSupported: false });
        try {
            const info = await parser.getInfo();
            if (info.total > 250) throw new Error('El PDF supera las 250 páginas.');
            const parsed = await parser.getText();
            rows = parseSapText(parsed.text);
        } finally {
            await parser.destroy();
        }
    } else if (/\.xlsx$/i.test(fileName) && buffer.subarray(0, 2).toString() === 'PK') {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        rows = [];
        const aliases = {
            DOCENTE: 'docenteId', ID_DOCENTE: 'docenteId', DOCENTEID: 'docenteId',
            NOMBRE_DOCENTE: 'nombre_docente', CODIGO: 'codigo', ID_CLASE: 'codigo',
            NOMBRE_CLASE: 'nombre_clase', ASIGNATURA: 'nombre_clase', SECCION: 'seccion',
            FECHA_INICIO: 'fecha_inicio', FECHA_FINAL: 'fecha_final', HORA_INICIO: 'hora_inicio',
            HORA_FINAL: 'hora_final', DIAS: 'dias', CAMPUS: 'campus', OBSERVACION: 'observacion'
        };
        for (const sheet of workbook.worksheets) {
            if (sheet.rowCount > 10000 || sheet.columnCount > 100) throw new Error('La hoja de Excel es demasiado grande.');
            let headers;
            const text = [];
            sheet.eachRow(line => {
                const cells = [];
                line.eachCell({ includeEmpty: true }, (cell, column) => {
                    cells[column - 1] = cellText(cell, headers && headers[column - 1]);
                });
                text.push(cells.join('\n'));
                const mapped = cells.map(cell => aliases[normalize(cell).replace(/\s+/g, '_')]);
                if (mapped.includes('docenteId') && mapped.includes('codigo')) {
                    headers = mapped;
                    return;
                }
                if (headers && cells.some(Boolean)) {
                    const row = {};
                    headers.forEach((key, index) => { if (key) row[key] = cells[index] || ''; });
                    rows.push(row);
                }
            });
            if (!headers) rows.push(...parseSapText(text.join('\n')));
        }
    } else {
        throw new Error('Selecciona un PDF con texto o un archivo Excel .xlsx.');
    }
    if (!rows.length) throw new Error('No se encontraron clases. Usa un PDF SAP con texto o el formato Excel descargable.');
    if (rows.length > 3000) throw new Error('Solo se permiten 3000 clases por importación.');
    return rows;
}

async function writeExcel(rows) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Carga académica');
    sheet.columns = COLUMNS.map(key => ({ header: key, key, width: key.includes('nombre') ? 45 : 20 }));
    rows.forEach(row => sheet.addRow(Object.fromEntries(COLUMNS.map(key => [key, String(row[key] ?? '')]))));
    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    return Buffer.from(await workbook.xlsx.writeBuffer()).toString('base64');
}

module.exports = { DAYS, COLUMNS, normalize, parseSapText, readFile, writeExcel };
