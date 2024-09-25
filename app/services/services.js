'use strict'

const jwt = require('jwt-simple');
const moment = require('moment');
const config = require('../config/config');

function createToken(user) {
    const payload = {
        sub: user,
        iat: moment().unix,
        exp: moment().add(15, 'days').unix()
    }
    return jwt.encode(payload, config.SECRET_TOKEN);
}

function decodeToken(token) {
    const decoded = new Promise(function (resolve, reject) {
        try {
            const payload = jwt.decode(token, config.SECRET_TOKEN);
            if (payload.exp <= moment().unix()) { reject({ status: 401, message: 'Token expired' }); }
            resolve(payload.sub);
        } catch (error) {
            reject({
                status: 500,
                message: 'Invalid token'
            });
        }
    });
    return decoded;
}
module.exports = { createToken, decodeToken };