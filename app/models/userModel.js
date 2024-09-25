'use strict'

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const attributes = {
        userId: {
            type: DataTypes.STRING(13),
            primaryKey: true
        },
        pass: {
            type: DataTypes.STRING(255)
        },
        roleId: {
            type: DataTypes.INTEGER
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

    return sequelize.define('user', attributes, options);
}