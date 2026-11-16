'use strict';

const jwt = require('jwt-simple');
const crypto = require('crypto');

function passwordVersion(user) {
    return crypto.createHash('sha256').update(user.pass).digest('hex');
}

function encodeToken(user, purpose, lifetime) {
    const now = Math.floor(Date.now() / 1000);
    return jwt.encode({
        sub: user.userId,
        purpose,
        version: passwordVersion(user),
        iat: now,
        exp: now + lifetime
    }, process.env.SECRET_TOKEN, 'HS256');
}

function createToken(user) {
    return encodeToken(user, 'access', 60 * 60);
}

function createInvitation(user) {
    return encodeToken(user, 'invitation', 24 * 60 * 60);
}

async function decodeToken(token, purpose = 'access') {
    try {
        const payload = jwt.decode(token, process.env.SECRET_TOKEN, false, 'HS256');
        const now = Math.floor(Date.now() / 1000);
        if (payload.purpose !== purpose || typeof payload.sub !== 'string' ||
            !Number.isFinite(payload.exp) || payload.exp <= now ||
            !Number.isFinite(payload.iat) || payload.iat > now || typeof payload.version !== 'string') {
            throw new Error('Invalid token');
        }
        return payload;
    } catch {
        throw { status: 401, message: 'La sesión no es válida o ha expirado.' };
    }
}

module.exports = { createToken, createInvitation, decodeToken, passwordVersion };