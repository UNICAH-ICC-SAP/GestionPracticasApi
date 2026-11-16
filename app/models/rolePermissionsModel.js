'use strict'

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const attributes = {
        roleId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        permissionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
    };
    const options = {
        defaultScope: {
            attributes: { exclude: [] }
        },
        scopes: {},
        tableName: 'role_permissions',
        timestamps: false
    }

    return sequelize.define('role_permissions', attributes, options);
};