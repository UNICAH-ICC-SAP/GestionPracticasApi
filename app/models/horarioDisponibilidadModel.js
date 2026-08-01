'use strict'

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const attributes = {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        docenteId: {
            type: DataTypes.STRING(13)
        },
        dia: {
            type: DataTypes.INTEGER
        },
        franja_inicio: {
            type: DataTypes.TIME
        },
        franja_fin: {
            type: DataTypes.TIME
        },
        disponible: {
            type: DataTypes.TINYINT,
            defaultValue: 1
        },
        tipo: {
            type: DataTypes.STRING(10),
            defaultValue: 'clase'
        }
    }
    const options = {
        defaultScope: {
            attributes: { exclude: ['createdAt', 'updatedAt'] }
        },
        tableName: 'Calendario_disponibilidad_docente',
        timestamps: false
    }

    return sequelize.define('Calendario_disponibilidad_docente', attributes, options);
}
