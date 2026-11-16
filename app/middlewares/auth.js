'use strict';

const services = require('../services/tokenService');
const db = require('../config/db');
const { isAdmin, hasPermission } = require('../services/accessService');

async function authenticate(req, res, next, allowPasswordReset) {
    const match = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization || '');
    if (!match) return res.status(401).send({ message: 'Se requiere una sesión válida.' });

    try {
        const payload = await services.decodeToken(match[1]);
        const user = await db.users.findByPk(payload.sub);
        if (!user || payload.version !== services.passwordVersion(user)) {
            return res.status(401).send({ message: 'La sesión no es válida o ha expirado.' });
        }
        if (user.passwordResetRequired && !allowPasswordReset) {
            return res.status(403).send({ message: 'Debes actualizar tu contraseña para continuar.' });
        }
        req.user = user;
        return next();
    } catch (error) {
        return res.status(error.status || 500).send({
            message: error.status === 401 ? error.message : 'No se pudo validar la sesión.'
        });
    }
}

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
