'use strict'

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const attributes = {
        id_periodo: {
            type: DataTypes.STRING(10),
            primaryKey: true
        },
        fecha_inicio: {
            type: DataTypes.DATE
        },
        fecha_final: {
            type: DataTypes.DATE
        },
    }
    const options = {
        defaultScope: {
            //TODO: Exclude attributes by default here
            attributes: { exclude: ['createdAt', 'updatedAt'] }
        },
        scopes: {
            //TODO: Includes attributes for scopes here
        },
        tableName: 'periodos',
        timestamps: 'false'
    }

    return sequelize.define('periodos', attributes, options);
}