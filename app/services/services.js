'use strict'

const jwt = require('jwt-simple');
const moment = require('moment');

function createToken(user) {
    const payload = {
        sub: user,
        iat: moment().unix,
        exp: moment().add(15, 'days').unix()
    }
    /*eslint-disable no-undef*/
    return jwt.encode(payload, process.env.SECRET_TOKEN);
    /*eslint-enable no-undef*/
}

function decodeToken(token) {
    const decoded = new Promise(function (resolve, reject) {
        try {
            /*eslint-disable no-undef*/
            const payload = jwt.decode(token, process.env.SECRET_TOKEN);
            /*eslint-enable no-undef*/
            if (payload.exp <= moment().unix()) { reject({ status: 401, message: 'Token expired' }); }
            resolve(payload.sub);
        } catch (error) {
            reject({
                status: 500,
                message: `Invalid token`,
                errorMessage: error.message
            });
        }
    });
    return decoded;
}
module.exports = { createToken, decodeToken };