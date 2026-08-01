'use strict'

const db = require('../config/db');
const UserPermission = db.userPermission;
const Permission = db.permissions;
const RolePermission = db.rolePermission;
const User = db.users;

async function insert(req, res) {
    const body = req.body;

    UserPermission.create({
        userId: body.userId,
        permissionId: body.permissionId,
        type: body.type // 'ALLOW' | 'DENY'
    })
        .then(data => {
            res.status(200).send(data);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send({
                message: error.message || "Error al asignar permiso al usuario"
            });
        });
}

async function findAll(req, res) {
    UserPermission.findAll({
        include: [{ model: Permission }]
    })
        .then(data => {
            res.status(200).send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Error al obtener permisos de usuarios"
            });
        });
}

// Combina permisos directos del usuario + permisos heredados de su rol
async function findPermissionsByUser(req, res) {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).send({
                message: "userId es requerido"
            });
        }

        // 1. Obtener el usuario para saber su rol
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).send({
                message: "Usuario no encontrado"
            });
        }

        // 2. Permisos directos del usuario (tabla user_permissions)
        const userPerms = await UserPermission.findAll({
            where: { userId },
            include: [{
                model: Permission,
                attributes: ['permissionId', 'name', 'description']
            }]
        });

        // 3. Permisos heredados del rol (tabla role_permissions)
        const rolePerms = await RolePermission.findAll({
            where: { roleId: user.roleId },
            include: [{
                model: Permission,
                attributes: ['permissionId', 'name', 'description']
            }]
        });

        // 4. Normalizar ambos arreglos a un mismo formato
        const fromRole = rolePerms.map(item => ({
            permissionId: item.permission.permissionId,
            permission: item.permission.name,
            description: item.permission.description,
            type: 'ALLOW', // role_permissions no maneja DENY, se asume ALLOW
            source: 'role'
        }));

        const fromUser = userPerms.map(item => ({
            permissionId: item.permission.permissionId,
            permission: item.permission.name,
            description: item.permission.description,
            type: item.type, // 'ALLOW' | 'DENY'
            source: 'user'
        }));

        // 5. Combinar: el permiso explícito del usuario tiene prioridad sobre el del rol
        const combined = [...fromRole, ...fromUser].reduce((acc, curr) => {
            const existing = acc.find(p => p.permissionId === curr.permissionId);
            if (!existing) {
                acc.push(curr);
            } else if (curr.source === 'user') {
                Object.assign(existing, curr);
            }
            return acc;
        }, []);

        const result = {
            userId,
            permissions: combined
        };

        return res.status(200).send(result);

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: error.message || "Error al obtener permisos del usuario"
        });
    }
}

async function updateType(req, res) {
    const { userId, permissionId } = req.query;
    const { type } = req.body;

    if (!userId || !permissionId) {
        return res.status(400).send({
            message: "userId y permissionId son requeridos"
        });
    }

    UserPermission.update(
        { type },
        {
            where: {
                userId,
                permissionId
            }
        }
    )
        .then(num => {
            if (num == 1) {
                res.status(200).send({
                    message: "Permiso actualizado correctamente"
                });
            } else {
                res.status(404).send({
                    message: "No se encontró el registro a actualizar"
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Error al actualizar permiso"
            });
        });
}

async function remove(req, res) {
    const { userId, permissionId } = req.query;

    if (!userId || !permissionId) {
        return res.status(400).send({
            message: "userId y permissionId son requeridos"
        });
    }

    UserPermission.destroy({
        where: {
            userId,
            permissionId
        }
    })
        .then(num => {
            if (num == 1) {
                res.status(200).send({
                    message: "Permiso eliminado correctamente"
                });
            } else {
                res.status(404).send({
                    message: "No se encontró el permiso a eliminar"
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Error al eliminar permiso"
            });
        });
}

module.exports = {
    findAll,
    findPermissionsByUser,
    insert,
    remove,
    updateType
}