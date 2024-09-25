'use strict'

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const attributes = {
        roleId: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        roleDescription: {
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
        tableName: 'role',
        timestamps: 'false'
    }

    return sequelize.define('roles', attributes, options);
}