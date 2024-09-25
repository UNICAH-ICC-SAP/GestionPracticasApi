'use strict'

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const attributes = {
        documentoId: {
            type: DataTypes.STRING(255),
            primaryKey: true
        },
        nombreArchivo: {
            type: DataTypes.STRING(50)
        },
        ruta: {
            type: DataTypes.STRING(255)
        },
        estado: {
            type: DataTypes.BOOLEAN
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
        tableName: 'user',
        timestamps: 'false'
    }

    return sequelize.define('users', attributes, options);
}