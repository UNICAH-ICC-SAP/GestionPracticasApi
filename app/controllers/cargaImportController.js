'use strict';

const parser = require('../services/cargaImportParser');
const service = require('../services/cargaImportService');

async function preview(req, res) {
    try {
        const { nombre, archivo, id_periodo, facultadId } = req.body;
        const rows = await parser.readFile(nombre, archivo);
        const result = await service.prepare(rows, id_periodo, facultadId);
        return res.status(200).send({ filas: result.filas, registros: result.registros.length, duplicados: result.duplicados });
    } catch (error) {
        return res.status(error.status || 400).send({ message: error.message || 'No se pudo leer el archivo.' });
    }
}

async function confirm(req, res) {
    try {
        const result = await service.confirm(req.body.filas, req.body.id_periodo, req.body.facultadId);
        return res.status(201).send(result);
    } catch (error) {
        return res.status(error.status || 500).send({
            message: error.status ? error.message : 'No se pudo guardar la carga. No se guardó ningún registro.',
            ...(error.filas ? { filas: error.filas } : {})
        });
    }
}

async function excel(req, res) {
    try {
        const rows = req.body.filas || [];
        if (!Array.isArray(rows) || rows.length > 3000 || rows.some(row => !row || typeof row !== 'object')) {
            return res.status(400).send({ message: 'Las filas de Excel no son válidas.' });
        }
        return res.status(200).send({ archivo: await parser.writeExcel(rows) });
    } catch {
        return res.status(500).send({ message: 'No se pudo generar el archivo Excel.' });
    }
}

module.exports = { preview, confirm, excel };
