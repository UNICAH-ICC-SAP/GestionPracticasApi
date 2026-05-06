'use strict'

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const attributes = {
        archivoId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.STRING(13),
            allowNull: false
        },
        userName: {
            type: DataTypes.STRING(150),
            allowNull: false
        },
        userFolder: {
            type: DataTypes.STRING(250),
            allowNull: false
        },
        originalName: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        storedName: {
            type: DataTypes.STRING(500),
            allowNull: false
        },
        mimeType: {
            type: DataTypes.STRING(120),
            allowNull: false
        },
        sizeBytes: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        provider: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'GCP'
        },
        bucketName: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        fileUrl: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('PENDING', 'UPLOADED', 'FAILED'),
            allowNull: false,
            defaultValue: 'PENDING'
        },
        fileStatus: {
            type: DataTypes.ENUM('PENDING', 'DELIVERED', 'CHANGE_REQUESTED'),
            allowNull: false,
            defaultValue: 'DELIVERED'
        },
        fileTypeId: {
            type: DataTypes.INTEGER
        }
    }

    const options = {
        defaultScope: {
            attributes: { exclude: ['createdAt', 'updatedAt'] }
        },
        scopes: {},
        tableName: 'archivo',
        timestamps: false
    }

    return sequelize.define('archivo', attributes, options);
}