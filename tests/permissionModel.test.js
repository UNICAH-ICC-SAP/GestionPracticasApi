'use strict';

const { Sequelize } = require('sequelize');

let sequelize;
let Permission;
let Role;

beforeEach(() => {
    sequelize = new Sequelize('test', 'test', 'test', { dialect: 'mysql', logging: false });
    Permission = require('../app/models/permissionModel')(sequelize);
    Role = require('../app/models/roleModel')(sequelize);
    const RolePermission = require('../app/models/rolePermissionsModel')(sequelize);
    Role.belongsToMany(Permission, {
        through: RolePermission,
        foreignKey: 'roleId',
        otherKey: 'permissionId'
    });
});

afterEach(async () => {
    jest.restoreAllMocks();
    await sequelize.close();
});

test('permission model targets the permission table and fields', () => {
    expect(Permission.getTableName()).toBe('permissions');
    expect(Object.keys(Permission.rawAttributes)).toEqual(['permissionId', 'name', 'description']);
    expect(Permission.primaryKeyAttribute).toBe('permissionId');
});

test('roles expose the permissions association consumed by the menu', () => {
    expect(Role.associations.permissions.target).toBe(Permission);
    expect(Role.associations.users).toBeUndefined();
});

test('role permission queries join permissions without document or password fields', async () => {
    const query = jest.spyOn(sequelize, 'query').mockResolvedValue([]);
    await Role.findAll({
        where: { roleId: 1 },
        include: [{ model: Permission, through: { attributes: [] } }]
    });
    const sql = query.mock.calls[0][0];
    expect(sql).toContain('JOIN `permissions`');
    expect(sql).toContain('`permissions`.`permissionId`');
    expect(sql).toContain('`permissions`.`name`');
    expect(sql).not.toContain('documentoId');
    expect(sql).not.toContain('nombreArchivo');
    expect(sql).not.toContain('`pass`');
});