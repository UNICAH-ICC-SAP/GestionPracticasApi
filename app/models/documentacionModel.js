'use strict'

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const attributes = {
        documentacionId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        alumnoId: {
            type: DataTypes.STRING(13)
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
        tableName: 'documentacion',
        timestamps: 'false'
    }

    return sequelize.define('documentacions', attributes, options);
}