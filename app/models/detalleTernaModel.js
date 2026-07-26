'use strict'

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const attributes = {
        detalleTernaId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        ternaId: {
            type: DataTypes.INTEGER
        },
        docenteId: {
            type: DataTypes.STRING(13)
        },
        coordina: {
            type: DataTypes.BOOLEAN
        },
        rol: {
            type: DataTypes.VIRTUAL,
            get() {
                const val = this.getDataValue('coordina');
                if (val === null || val === undefined) return '';
                return val ? 'coordina' : 'miembro';
            }
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
        tableName: 'detalle_terna',
        timestamps: 'false'
    }

    return sequelize.define('detalleTerna', attributes, options);
}