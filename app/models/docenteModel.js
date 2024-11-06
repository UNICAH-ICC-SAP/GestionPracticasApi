'use strict'

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const attributes = {
        docenteId: {
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
            type: DataTypes.STRING(5)
        },
        telefono: {
            type: DataTypes.STRING(9)
        },
        estadoDocente: {
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
        tableName: 'docente',
        timestamps: 'false'
    }

    return sequelize.define('docente', attributes, options);
}