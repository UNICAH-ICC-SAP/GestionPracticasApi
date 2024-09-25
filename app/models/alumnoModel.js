'use strict'

const { DataTypes } = require('sequelize');
const facultad = require('../models/facultadModel')

module.exports = (sequelize) => {
    const attributes = {
        alumnoId: {
            type: DataTypes.STRING(13),
            primaryKey: true
        },
        email: {
            type: DataTypes.STRING(50)
        },
        nombre: {
            type: DataTypes.STRING(50)
        },
        facultadId: {
            type: DataTypes.STRING(5),
        },
        telefono: {
            type: DataTypes.STRING(9)
        }
    }
    const options = {
        defaultScope: {
            //TODO: Exclude attributes by default here
            attributes: { exclude: ['createdAt', 'updatedAt'] }
        },
        scopes: {
            //TODO: Includes attributes for scopes here
        },
        tableName: 'alumno',
        timestamps: 'false'
    }
    return sequelize.define('alumno', attributes, options);
    // alumno.associate = function () {
    //     alumno.hasOne(facultad, { foreignKey: 'facultadId', sourceKey: 'facultadId' })
    // }
    //  alumno;
}