'use strict'

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const attributes = {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        permissionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'permissions',
                key: 'permissionId'
            }
        },
        type: {
            type: DataTypes.ENUM('ALLOW', 'DENY'),
            allowNull: false
        }
    }

    const options = {
        defaultScope: {
            attributes: { exclude: [] }
        },
        scopes: {},
        tableName: 'user_permissions',
        timestamps: false
    }

    return sequelize.define('user_permissions', attributes, options);
}