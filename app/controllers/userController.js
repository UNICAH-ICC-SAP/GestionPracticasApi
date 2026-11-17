'use strict';

const db = require('../config/db');
const User = db.users;
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const service = require('../services/tokenService');

function validPassword(value) {
    return typeof value === 'string' && value.length >= 12 && Buffer.byteLength(value, 'utf8') <= 72;
}

async function signUp(req, res) {
    const { userId, accountType } = req.body;
    const roles = { docente: 2, alumno: 3 };
    if (typeof userId !== 'string' || !/^\d{1,13}$/.test(userId) || typeof accountType !== 'string' ||
        !Object.prototype.hasOwnProperty.call(roles, accountType)) {
        return res.status(400).send({ message: 'El identificador y el tipo de cuenta no son válidos.' });
    }

    try {
        const pass = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
        const user = await User.create({ userId, pass, roleId: roles[accountType], passwordResetRequired: true });
        return res.status(201).send({
            userId: user.userId,
            roleId: user.roleId,
            invitationToken: service.createInvitation(user)
        });
    } catch (error) {
        return res.status(error.name === 'SequelizeUniqueConstraintError' ? 409 : 500).send({
            message: error.name === 'SequelizeUniqueConstraintError' ? 'El usuario ya existe.' : 'No se pudo crear el usuario.'
        });
    }
}

async function signIn(req, res) {
    const { userId, pass } = req.body;
    if (typeof userId !== 'string' || !userId || typeof pass !== 'string' || !pass || Buffer.byteLength(pass, 'utf8') > 72) {
        return res.status(400).send({ message: 'Ingresa tu usuario y contraseña.' });
    }

    try {
        const user = await User.findByPk(userId);
        if (!user || !await bcrypt.compare(pass, user.pass)) {
            return res.status(401).send({ message: 'Usuario o contraseña incorrectos.' });
        }
        return res.status(200).send({
            message: 'Sesión iniciada.',
            userId: user.userId,
            roleId: user.roleId,
            token: service.createToken(user),
            passwordResetRequired: Boolean(user.passwordResetRequired)
        });
    } catch {
        return res.status(500).send({ message: 'No se pudo iniciar sesión.' });
    }
}

function getUserInfo(req, res) {
    return res.status(200).send({
        userId: req.user.userId,
        roleId: req.user.roleId,
        passwordResetRequired: Boolean(req.user.passwordResetRequired)
    });
}

async function resetPassword(req, res) {
    const { currentPassword, newPassword } = req.body;
    if (req.query.userId && req.query.userId !== req.user.userId) {
        return res.status(403).send({ message: 'Solo puedes cambiar tu propia contraseña.' });
    }
    if (!validPassword(newPassword) || typeof currentPassword !== 'string') {
        return res.status(400).send({ message: 'Ingresa tu contraseña actual y una nueva de al menos 12 caracteres y hasta 72 bytes.' });
    }

    try {
        if (!await bcrypt.compare(currentPassword, req.user.pass)) {
            return res.status(401).send({ message: 'La contraseña actual es incorrecta.' });
        }
        const pass = await bcrypt.hash(newPassword, 10);
        const [updated] = await User.update({ pass, passwordResetRequired: false }, {
            where: { userId: req.user.userId, pass: req.user.pass }
        });
        if (!updated) return res.status(409).send({ message: 'La contraseña ya fue modificada. Inicia sesión nuevamente.' });
        return res.status(200).send({ message: 'Contraseña actualizada. Inicia sesión nuevamente.' });
    } catch {
        return res.status(500).send({ message: 'No se pudo actualizar la contraseña.' });
    }
}

async function activateAccount(req, res) {
    const { invitationToken, newPassword } = req.body;
    if (!validPassword(newPassword) || typeof invitationToken !== 'string') {
        return res.status(400).send({ message: 'La contraseña debe tener al menos 12 caracteres y hasta 72 bytes.' });
    }

    try {
        const payload = await service.decodeToken(invitationToken, 'invitation');
        const user = await User.findByPk(payload.sub);
        if (!user || !user.passwordResetRequired || payload.version !== service.passwordVersion(user)) {
            return res.status(401).send({ message: 'El enlace de activación no es válido o ya fue utilizado.' });
        }
        const pass = await bcrypt.hash(newPassword, 10);
        const [updated] = await User.update({ pass, passwordResetRequired: false }, {
            where: { userId: user.userId, pass: user.pass, passwordResetRequired: true }
        });
        if (!updated) return res.status(401).send({ message: 'El enlace de activación ya fue utilizado.' });
        return res.status(200).send({ message: 'Cuenta activada. Ya puedes iniciar sesión.' });
    } catch (error) {
        return res.status(error.status || 500).send({ message: error.status === 401 ? error.message : 'No se pudo activar la cuenta.' });
    }
}

async function renewInvitation(req, res) {
    const { userId } = req.body;
    if (typeof userId !== 'string' || !/^\d{1,13}$/.test(userId)) {
        return res.status(400).send({ message: 'El identificador del usuario no es válido.' });
    }
    try {
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).send({ message: 'Usuario no encontrado.' });
        const pass = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
        const [updated] = await User.update({ pass, passwordResetRequired: true }, {
            where: { userId, pass: user.pass }
        });
        if (!updated) return res.status(409).send({ message: 'El acceso ya fue modificado. Intenta nuevamente.' });
        return res.status(200).send({ invitationToken: service.createInvitation({ ...user, userId, pass }) });
    } catch {
        return res.status(500).send({ message: 'No se pudo renovar el enlace de activación.' });
    }
}

module.exports = { signUp, signIn, getUserInfo, resetPassword, activateAccount, renewInvitation };
