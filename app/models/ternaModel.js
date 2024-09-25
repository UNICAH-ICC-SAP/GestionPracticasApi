'use strict'

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const attributes = {
        ternaId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        alumnoId: {
            type: DataTypes.STRING(13)
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
        tableName: 'terna',
        timestamps: 'false'
    }

    return sequelize.define('terna', attributes, options);
}