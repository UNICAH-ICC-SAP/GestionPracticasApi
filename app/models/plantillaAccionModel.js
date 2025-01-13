'use strict'

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const attributes = {
        idAccionPlantilla: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        accion: {
            type: DataTypes.STRING(50)
        },
        plantillaCorreoId: {
            type: DataTypes.INTEGER,
        },
    }
    const options = {
        defaultScope: {
            //TODO: Exclude attributes by default here
            attributes: { exclude: ['createdAt', 'updatedAt'] }
        },
        scopes: {
            //TODO: Includes attributes for scopes here
        },
        tableName: 'accion_plantilla',
        timestamps: 'false'
    }
    return sequelize.define('accionPlantilla', attributes, options);
    // alumno.associate = function () {
    //     alumno.hasOne(facultad, { foreignKey: 'facultadId', sourceKey: 'facultadId' })
    // }
    //  alumno;
}