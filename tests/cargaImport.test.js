'use strict';

jest.mock('../app/config/db', () => ({
    Sequelize: require('sequelize'),
    periodos: { findByPk: jest.fn() },
    docente: { findAll: jest.fn() },
    clases: { findAll: jest.fn() },
    carrera_clase_bloque: { findAll: jest.fn() },
    detalle_periodo: { findAll: jest.fn(), bulkCreate: jest.fn() },
    sequelize: { transaction: jest.fn(), getQueryInterface: jest.fn() }
}));

const db = require('../app/config/db');
const parser = require('../app/services/cargaImportParser');
const service = require('../app/services/cargaImportService');
const ExcelJS = require('exceljs');

const row = {
    docenteId: '9599', nombre_docente: 'Ariel', codigo: 'INF1-IF101', nombre_clase: 'Informática I',
    seccion: '0801A', fecha_inicio: '2026-09-16', fecha_final: '2026-12-19',
    hora_inicio: '08:00', hora_final: '08:50', dias: 'LUN MIE', campus: 'SAP', observacion: 'NO'
};

beforeEach(() => {
    jest.resetAllMocks();
    db.periodos.findByPk.mockResolvedValue({ fecha_inicio: '2026-09-01', fecha_final: '2026-12-31' });
    db.docente.findAll.mockResolvedValue([{ docenteId: '9599', nombre: 'Ariel', estadoDocente: 1 }]);
    db.clases.findAll.mockResolvedValue([{ id_clase: 'IF101', nombre_clase: 'Informática I' }]);
    db.carrera_clase_bloque.findAll.mockResolvedValue([{ id_ccb: 1, id_clase: 'IF101', facultadId: 'INF', id_bloque: 1 }]);
    db.detalle_periodo.findAll.mockResolvedValue([]);
    db.sequelize.getQueryInterface.mockReturnValue({ describeTable: jest.fn().mockResolvedValue({ observacion: {} }) });
    db.sequelize.transaction.mockImplementation(async (options, callback) => callback({ LOCK: { UPDATE: 'UPDATE' } }));
});

test('preview works on legacy schemas without selecting the missing observation column', async () => {
    db.sequelize.getQueryInterface.mockReturnValue({ describeTable: jest.fn().mockResolvedValue({ id_detalle: {} }) });
    const result = await service.prepare([row], 'III-2026', 'INF');
    const query = db.detalle_periodo.findAll.mock.calls[0][0];
    expect(query.attributes).not.toContain('observacion');
    expect(result.filas[0].errores).toEqual([]);
    expect(result.filas[0].advertencias.join(' ')).toContain('Falta actualizar la base de datos');
    expect(db.detalle_periodo.bulkCreate).not.toHaveBeenCalled();
});

test('confirmation reports the missing migration before attempting an insert', async () => {
    db.sequelize.getQueryInterface.mockReturnValue({ describeTable: jest.fn().mockResolvedValue({ id_detalle: {} }) });
    await expect(service.confirm([row], 'III-2026', 'INF')).rejects.toMatchObject({
        status: 503, message: expect.stringContaining('npm run migrate:secciones')
    });
    expect(db.detalle_periodo.bulkCreate).not.toHaveBeenCalled();
});

test('parses SAP assignments across page headers and preserves nonconsecutive days', () => {
    const rows = parser.parseSapText(`#1 - 9599 : Ariel
Creditos: 3 Clases: 1
INF1-IF101 - Informática I
5/10/26, 4:31 p.m.UNICAH - Universidad Católica de Honduras
https://registro.cp.unicah.net/pages/alistadocentes.php?ver=123
Sección: 0801AEstado: Confirmado
Fechas: 2026-09-16 - 2026-12-19Campus: SAP
Hora: 08:00 - 08:50Creditos: 3
Tipo de asignación: ASIGNADODias: LUN - MIE - - -
Observación: NO`);
    expect(rows).toEqual([row]);
});

test('Excel round trip preserves teacher codes, accented names, section suffixes and dates', async () => {
    const file = await parser.writeExcel([row]);
    const rows = await parser.readFile('carga.xlsx', file);
    expect(rows).toEqual([row]);
});

test('reads native Excel dates and times without shifting sparse columns', async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Carga');
    sheet.addRow(parser.COLUMNS);
    const values = { ...row, nombre_docente: '', campus: '', observacion: '' };
    sheet.addRow(parser.COLUMNS.map(key => values[key]));
    sheet.getCell('F2').value = new Date('2026-09-16T00:00:00Z');
    sheet.getCell('G2').value = new Date('2026-12-19T00:00:00Z');
    sheet.getCell('H2').value = 8 / 24;
    sheet.getCell('H2').numFmt = 'hh:mm';
    sheet.getCell('I2').value = new Date('1899-12-30T08:50:00Z');
    sheet.getCell('I2').numFmt = 'hh:mm';
    const file = Buffer.from(await workbook.xlsx.writeBuffer()).toString('base64');
    expect(await parser.readFile('carga.xlsx', file)).toEqual([values]);
});

test('does not treat spreadsheet formula text as executable Excel on export', async () => {
    const file = await parser.writeExcel([{ ...row, nombre_docente: '=HYPERLINK("https://example.test")' }]);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(file, 'base64'));
    expect(workbook.worksheets[0].getCell('B2').type).toBe(ExcelJS.ValueType.String);
});

test('a failed bulk insert rejects confirmation and uses the managed transaction', async () => {
    db.detalle_periodo.bulkCreate.mockRejectedValue(new Error('Insert failed'));
    await expect(service.confirm([row], 'III-2026', 'INF')).rejects.toThrow('Insert failed');
    expect(db.sequelize.transaction).toHaveBeenCalledWith({
        isolationLevel: db.Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
    }, expect.any(Function));
    expect(db.detalle_periodo.bulkCreate).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({
        transaction: expect.objectContaining({ LOCK: { UPDATE: 'UPDATE' } })
    }));
});

test('rejects unsupported and malformed files', async () => {
    await expect(parser.readFile('carga.exe', Buffer.from('not a pdf').toString('base64'))).rejects.toThrow('Selecciona');
    await expect(parser.readFile('carga.pdf', '%%%')).rejects.toThrow('válido');
});

test('generates only the listed weekdays and keeps source dates and campus', async () => {
    const result = await service.prepare([row], 'III-2026', 'INF');
    expect(result.filas[0].errores).toEqual([]);
    expect(result.registros.map(record => record.dia_inicio)).toEqual([1, 3]);
    expect(result.registros[0].observacion).toContain('[SAP 2026-09-16 2026-12-19] Campus: SAP');
});

test('does not import unknown teachers, classes or dates outside the selected period', async () => {
    const result = await service.prepare([{ ...row, docenteId: '000', codigo: 'UNKNOWN', fecha_final: '2027-01-01' }], 'III-2026', 'INF');
    expect(result.filas[0].errores).toHaveLength(3);
    expect(result.registros).toEqual([]);
});

test('reimporting an identical schedule is idempotent', async () => {
    const first = await service.prepare([row], 'III-2026', 'INF');
    db.detalle_periodo.findAll.mockResolvedValue(first.registros);
    const second = await service.confirm([row], 'III-2026', 'INF');
    expect(second).toEqual({ insertados: 0, duplicados: 2 });
    expect(db.detalle_periodo.bulkCreate).not.toHaveBeenCalled();
});

test('a conflict cancels the entire confirmation before any bulk insert', async () => {
    await expect(service.confirm([row, { ...row, seccion: '0802' }], 'III-2026', 'INF')).rejects.toMatchObject({ status: 409 });
    expect(db.detalle_periodo.bulkCreate).not.toHaveBeenCalled();
});

test('overlapping times in separate date ranges do not conflict', async () => {
    const first = { ...row, fecha_final: '2026-10-01' };
    const second = { ...row, fecha_inicio: '2026-10-02', seccion: '0802' };
    const result = await service.confirm([first, second], 'III-2026', 'INF');
    expect(result.insertados).toBe(4);
    expect(db.detalle_periodo.bulkCreate).toHaveBeenCalledTimes(1);
});

test('a missing target period cannot be silently replaced with the latest one', async () => {
    db.periodos.findByPk.mockResolvedValue(null);
    await expect(service.confirm([row], 'III-2026', 'INF')).rejects.toMatchObject({ status: 400 });
    expect(db.detalle_periodo.bulkCreate).not.toHaveBeenCalled();
});
