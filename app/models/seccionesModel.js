'use strict'

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const attributes = {
        id_detalle: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        seccion: {
            type: DataTypes.STRING(10)
        },
        docenteId: {
            type: DataTypes.STRING(13)
        },
        id_ccb: {
            type: DataTypes.INTEGER
        },
        id_periodo: {
            type: DataTypes.STRING(10)
        },
        hora_inicio: {
            type: DataTypes.TIME
        },
        dia_inicio: {
            type: DataTypes.INTEGER
        },
        dia_final: {
            type: DataTypes.INTEGER
        },
        hora_final: {
            type: DataTypes.TIME
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
        tableName: 'detalle_periodo',
        timestamps: 'false'
    }

    return sequelize.define('detalle_periodo', attributes, options);
}