'use strict'
const services = require('../services/tokenService')
// const moment = require('moment')

function isAuth(req, res, next) {
    return authenticate(req, res, next, false);
}

function whoAmI(req, res, next) {
    return authenticate(req, res, next, true);
}

function requireAdmin(req, res, next) {
    if (!isAdmin(req.user)) return res.status(403).send({ message: 'No tienes permiso para realizar esta operación.' });
    return next();
}

function requirePermission(name) {
    return async (req, res, next) => {
        try {
            if (!await hasPermission(req.user, name)) {
                return res.status(403).send({ message: 'No tienes permiso para realizar esta operación.' });
            }
            return next();
        } catch {
            return res.status(500).send({ message: 'No se pudieron verificar los permisos.' });
        }
    };
}

function scopeQuery(getScope) {
    return async (req, res, next) => {
        try {
            const scope = await getScope(req.user);
            req.accessScope = scope;
            return next();
        } catch {
            return res.status(500).send({ message: 'No se pudo verificar el acceso a los registros.' });
        }
    };
}

function ownPermissions(field) {
    return (req, res, next) => {
        if (!isAdmin(req.user)) {
            const source = req.method === 'GET' ? req.query : req.body;
            const expected = field === 'roleId' ? req.user.roleId : req.user.userId;
            if (source[field] !== undefined && String(source[field]) !== String(expected)) {
                return res.status(403).send({ message: 'Solo puedes consultar tus propios permisos.' });
            }
            source[field] = expected;
        }
        return next();
    };
}

module.exports = { isAuth, whoAmI, requireAdmin, requirePermission, scopeQuery, ownPermissions };
