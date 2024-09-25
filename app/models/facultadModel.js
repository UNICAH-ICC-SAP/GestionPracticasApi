'use strict'

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const attributes = {
        facultadId: {
            type: DataTypes.STRING(5),
            primaryKey: true
        },
        nombreFacultad: {
            type: DataTypes.STRING(100)
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
        tableName: 'facultad',
        timestamps: 'false'
    }

    return sequelize.define('facultad', attributes, options);
}