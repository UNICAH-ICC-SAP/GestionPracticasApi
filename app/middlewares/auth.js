'use strict'
const services = require('../services/services')
// const moment = require('moment')

function isAuth(req, res, next) {
    if (!req.headers.authorization) return res.status(403).send({ message: 'Not authorized' });
    const token = req.headers.authorization.split(' ')[1];
    services.decodeToken(token)
        .then(data => {
            req.user = data;
            next();
        })
        .catch(err => {
            res.status(500).send({ message: err.message });
        });
}

function whoAmI(req, res, next) {
    if (!req.headers.authorization) return res.status(403).send({ message: 'Authorization header not found' });
    var token = req.headers.authorization.split(' ')[1];
    services.decodeToken(token)
        .then(data => {
            req.body.userId = data;
            next();
        }
        ).catch(err => {
            res.status(err.status);
        });
}

module.exports = { isAuth, whoAmI };