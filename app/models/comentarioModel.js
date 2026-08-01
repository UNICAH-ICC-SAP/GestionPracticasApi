'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const attributes = {
        comentarioId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        modulo: {
            type: DataTypes.ENUM('TERNA', 'CARGA_ASIGNADA'),
            allowNull: false
        },
        referenciaId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        userId: {
            type: DataTypes.STRING(13),
            allowNull: false
        },
        mensaje: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        eliminado: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    };
    const options = {
        tableName: 'comentario',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    };

    return sequelize.define('comentario', attributes, options);
};
