'use strict';

const db = require('../config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { createInvitation } = require('../services/tokenService');

async function register(req, res) {
    const { accountType, profile, detalleTernas } = req.body;
    if (!['alumno', 'docente'].includes(accountType) || !profile || typeof profile !== 'object') {
        return res.status(400).send({ message: 'El tipo de cuenta y los datos del titular son requeridos.' });
    }

    const idField = accountType === 'alumno' ? 'alumnoId' : 'docenteId';
    const userId = profile[idField];
    const limits = { nombre: 50, email: 50, facultadId: 5, telefono: 15 };
    if (typeof userId !== 'string' || !/^\d{1,13}$/.test(userId) ||
        Object.entries(limits).some(([key, limit]) => typeof profile[key] !== 'string' ||
            !profile[key].trim() || profile[key].length > limit) ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
        return res.status(400).send({ message: 'Los datos del titular no son válidos.' });
    }
    if (accountType === 'alumno' && (!Array.isArray(detalleTernas) || detalleTernas.length !== 3 ||
        new Set(detalleTernas.map(detail => detail && detail.docenteId)).size !== 3 ||
        new Set(detalleTernas.map(detail => detail && detail.rol)).size !== 3 ||
        detalleTernas.some(detail => !detail || typeof detail.docenteId !== 'string' ||
            !['coordina', 'estilo', 'tecnico'].includes(detail.rol)))) {
        return res.status(400).send({ message: 'Selecciona tres docentes distintos, con un coordinador, un revisor de estilo y un revisor técnico.' });
    }

    try {
        const pass = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
        const result = await db.sequelizeInstance.transaction(async transaction => {
            if (!await db.facultad.findByPk(profile.facultadId, { transaction })) {
                throw { status: 400, message: 'La facultad seleccionada no existe.' };
            }
            if (accountType === 'alumno') {
                const docentes = await db.docente.findAll({
                    where: {
                        docenteId: { [db.Sequelize.Op.in]: detalleTernas.map(detail => detail.docenteId) },
                        estadoDocente: true
                    },
                    transaction
                });
                if (docentes.length !== 3) throw { status: 400, message: 'Los docentes seleccionados deben estar activos.' };
            }
            const user = await db.users.create({
                userId,
                pass,
                roleId: accountType === 'alumno' ? 3 : 2,
                passwordResetRequired: true
            }, { transaction });
            const model = accountType === 'alumno' ? db.alumno : db.docente;
            const data = Object.fromEntries(Object.keys(limits).map(key => [key, profile[key]]));
            await model.create({
                ...data,
                [idField]: userId,
                [accountType === 'alumno' ? 'estadoAlumno' : 'estadoDocente']: true
            }, { transaction });

            let ternaId;
            if (accountType === 'alumno') {
                const terna = await db.terna.create({ alumnoId: userId, idEstadoTerna: 2 }, { transaction });
                ternaId = terna.ternaId;
                await db.detalleTerna.bulkCreate(detalleTernas.map(detail => ({
                    ternaId,
                    docenteId: detail.docenteId,
                    rol: detail.rol
                })), { transaction });
            }
            return { userId, ternaId, invitationToken: createInvitation(user) };
        });
        return res.status(201).send(result);
    } catch (error) {
        const duplicate = error.name === 'SequelizeUniqueConstraintError';
        return res.status(error.status || (duplicate ? 409 : 500)).send({
            message: error.status ? error.message : duplicate ? 'El usuario ya existe.' : 'No se pudo completar el registro. No se guardaron cambios.'
        });
    }
}

module.exports = { register };