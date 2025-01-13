'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const attributes = {
        Id_correo: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        correo_origen: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        correo_password: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        asunto: {
            type: DataTypes.STRING(100),
            allowNull: false, // Definir que no puede ser nulo para mayor control
        },
        cuerpo: {
            type: DataTypes.TEXT,
            allowNull: false, // Definir que no puede ser nulo para asegurar contenido
        },
        estado: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    };

    const options = {
        defaultScope: {
            attributes: { exclude: ['createdAt', 'updatedAt'] }
        },
        scopes: {
            // Aquí podrías agregar un scope para obtener solo los correos activos
            activo: {
                where: { estado: true }
            }
        },
        tableName: 'plantilla_correo', // Respetar el nombre definido en la base de datos
        timestamps: false // Corrección, no debe ir como 'false' (string) sino false (booleano)
    }

    return sequelize.define('plantilla_correo', attributes, options); // Mantener el nombre del modelo como 'plantilla_correo'
};
