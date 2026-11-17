'use strict';

const { DataTypes } = require('sequelize');

async function addSeccionesObservacion(sequelize) {
    const queryInterface = sequelize.getQueryInterface();
    const columns = await queryInterface.describeTable('detalle_periodo');

    if (!columns.observacion) {
        await queryInterface.addColumn('detalle_periodo', 'observacion', {
            type: DataTypes.TEXT,
            allowNull: true
        });
    }
}

module.exports = addSeccionesObservacion;

if (require.main === module) {
    const db = require('../config/db');

    addSeccionesObservacion(db.sequelize)
        .then(() => console.info('Columna detalle_periodo.observacion disponible.'))
        .catch(error => {
            console.error('No se pudo migrar detalle_periodo:', error.message);
            process.exitCode = 1;
        })
        .finally(() => db.sequelize.close());
}
