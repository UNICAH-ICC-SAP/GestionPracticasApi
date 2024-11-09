'use strict'

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const attributes = {
        id_carrera: {
            type: DataTypes.STRING(10),
        },
        id_clase: {
            type: DataTypes.STRING(100)
        },
        id_bloque: {
            type: DataTypes.INTEGER(11)
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
        tableName: 'carrera_clase_bloque',
        timestamps: 'false'
    }

    return sequelize.define('carrera_clase_bloque', attributes, options);
}