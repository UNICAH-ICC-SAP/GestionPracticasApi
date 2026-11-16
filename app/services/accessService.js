'use strict';

const db = require('../config/db');

function isAdmin(user) {
    return Number(user.roleId) === 1;
}

async function hasPermission(user, name) {
    const permission = await db.permissions.findOne({ where: { name } });
    if (!permission) return false;

    const override = await db.userPermission.findOne({
        where: { userId: user.userId, permissionId: permission.permissionId }
    });
    if (override) return override.type === 'ALLOW';
    if (isAdmin(user)) return true;

    return Boolean(await db.rolePermission.findOne({
        where: { roleId: user.roleId, permissionId: permission.permissionId }
    }));
}

async function canAccessStudent(user, alumnoId) {
    if (isAdmin(user) || String(user.userId) === String(alumnoId)) return true;
    if (Number(user.roleId) !== 2) return false;

    const ternas = await db.terna.findAll({ where: { alumnoId }, attributes: ['ternaId'] });
    if (!ternas.length) return false;

    return Boolean(await db.detalleTerna.findOne({
        where: {
            docenteId: user.userId,
            ternaId: { [db.Sequelize.Op.in]: ternas.map(terna => terna.ternaId) }
        }
    }));
}

async function ternaScope(user) {
    if (isAdmin(user)) return {};
    if (Number(user.roleId) === 3) return { alumnoId: user.userId };
    const details = Number(user.roleId) === 2
        ? await db.detalleTerna.findAll({ where: { docenteId: user.userId }, attributes: ['ternaId'] })
        : [];
    return { ternaId: { [db.Sequelize.Op.in]: details.map(detail => detail.ternaId) } };
}

async function studentScope(user) {
    if (isAdmin(user)) return {};
    if (Number(user.roleId) === 3) return { alumnoId: user.userId };
    const ternas = await db.terna.findAll({ where: await ternaScope(user), attributes: ['alumnoId'] });
    return { alumnoId: { [db.Sequelize.Op.in]: ternas.map(terna => terna.alumnoId) } };
}

async function detailScope(user) {
    if (isAdmin(user)) return {};
    const ternas = await db.terna.findAll({ where: await ternaScope(user), attributes: ['ternaId'] });
    return { ternaId: { [db.Sequelize.Op.in]: ternas.map(terna => terna.ternaId) } };
}

async function teacherScope(user) {
    if (isAdmin(user)) return {};
    const details = await db.detalleTerna.findAll({ where: await detailScope(user), attributes: ['docenteId'] });
    return { docenteId: { [db.Sequelize.Op.in]: [user.userId, ...details.map(detail => detail.docenteId)] } };
}

module.exports = { isAdmin, hasPermission, canAccessStudent, ternaScope, studentScope, detailScope, teacherScope };
