'use strict';

const migrate = require('../app/migrations/addSeccionesObservacion');
const { DataTypes } = require('sequelize');

test('adds the missing nullable observation without changing existing fields', async () => {
    const queryInterface = {
        describeTable: jest.fn().mockResolvedValue({ id_detalle: {} }),
        addColumn: jest.fn().mockResolvedValue(undefined)
    };

    await migrate({ getQueryInterface: () => queryInterface });

    expect(queryInterface.describeTable).toHaveBeenCalledWith('detalle_periodo');
    expect(queryInterface.addColumn).toHaveBeenCalledWith('detalle_periodo', 'observacion', {
        type: DataTypes.TEXT,
        allowNull: true
    });
});

test('preserves an existing observation column when run again', async () => {
    const queryInterface = {
        describeTable: jest.fn().mockResolvedValue({ observacion: {} }),
        addColumn: jest.fn()
    };

    await migrate({ getQueryInterface: () => queryInterface });

    expect(queryInterface.addColumn).not.toHaveBeenCalled();
});

test('propagates schema failures to prevent reporting a successful migration', async () => {
    const queryInterface = {
        describeTable: jest.fn().mockRejectedValue(new Error('Connection failed')),
        addColumn: jest.fn()
    };

    await expect(migrate({ getQueryInterface: () => queryInterface })).rejects.toThrow('Connection failed');
    expect(queryInterface.addColumn).not.toHaveBeenCalled();
});
