'use strict'

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const attributes = {
        detalleDocumentacionId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        documentacionId: {
            type: DataTypes.INTEGER
        },
        documentoId: {
            type: DataTypes.STRING(255)
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
        tableName: 'detalle_documentacion',
        timestamps: 'false'
    }

    return sequelize.define('detalle_documentacion', attributes, options);
}