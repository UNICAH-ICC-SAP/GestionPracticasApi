'use strict'

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const attributes = {
        id_clase: {
            type: DataTypes.STRING(10),
            primaryKey: true
        },
        nombre_clase: {
            type: DataTypes.STRING(100)
        },
        creditos: {
            type: DataTypes.INTEGER
        },
        estado: {
            type: DataTypes.BOOLEAN
        },
        TipoClase: {
            type: DataTypes.INTEGER
        }
    }
    const options = {
        defaultScope: {
            //TODO: Exclude attributes by default here
            attributes: { exclude: ['createdAt', 'updatedAt', 'updateAt'] }
        },
        scopes: {
            //TODO: Includes attributes for scopes here
        },
        tableName: 'clases',
        timestamps: 'false'
    }

    return sequelize.define('clases', attributes, options);
}