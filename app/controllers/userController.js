'use strict'

const db = require('../config/db')
const User = db.users;
const { Op } = require('sequelize')
const bcrypt = require('bcrypt');
const service = require('../services/services');

module.exports = {
    signUp,
    signIn,
    getUserInfo
}

async function signUp(req, res) {
    let newPass = undefined;
    await bcrypt.genSalt(10).then(async salts => {
        await bcrypt.hash(req.body['pass'], salts).then(hash => {
            newPass = hash;
        }).catch(error => console.error(error));
    }).catch(error => console.error(error));

    User.create({
        userId: req.body['userId'],
        pass: newPass,
        roleId: req.body['roleId'],
        passwordResetRequired: req.body['passwordResetRequired']
    })
        .then(data => {
            res.status(200).send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Sucedio un error al obtener los registros de actores"
            });
            console.log(err)
        });
};

async function signIn(req, res) {
    const userId = req.body['userId'];
    var condition = userId ? { userId: { [Op.eq]: `${userId}` } } : null;
    User.findOne({ where: condition })
        .then(data => {
            if (!data) { res.status(404).send({ message: 'Usuario no encontrado' }) }
            else {
                const result = bcrypt.compareSync(req.body['pass'], data['pass'], function (err, result) {
                    if (err) console.error(err)
                    return result
                });
                if (result) {
                    res.status(200).send({
                        message: 'Logged in',
                        userId: data['userId'],
                        roleId: data['roleId'],
                        token: service.createToken(data['userId'])
                    });
                } else {
                    res.status(500).send({
                        message: 'Sucedio un error inesperado',
                    });
                }
            }
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Sucedio un error al obtener los registros de actores"
            })
        })
}

function getUserInfo(req, res) {
    User.findOne({ where: { userId: req.body.userId } })
        .then(data => {
            if (!data) return res.status(404).send({ message: 'Not found' });
            req.data = data;
            res.status(200).send({
                message: 'Logged in',
                userId: data['userId'],
                roleId: data['roleId'],
            });

        })
        .catch(err => {
            if (err) return res.status(500).send({ message: err });

        })
}