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
        },
        idEstadoTerna: {
            type: DataTypes.INTEGER,
            allowNull: false, // Asumiendo que este campo es obligatorio
            defaultValue: 1, // Asumiendo que el valor por defecto es 1 (ok)
            validate: {
                isIn: [[1, 2, 3]] // Validación para los tres estados: 1, 2, 3
            }
        }
    };    
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