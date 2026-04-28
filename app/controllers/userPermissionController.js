'use strict'

const db = require('../config/db');
const UserPermission = db.userPermission;
const Permission = db.permissions;

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

async function findPermissionsByUser(req, res) {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).send({
                message: "userId es requerido"
            });
        }

        const data = await UserPermission.findAll({
            where: { userId },
            include: [{
                model: Permission,
                attributes: ['permissionId', 'name', 'description']
            }]
        });

        const result = {
            userId,
            permissions: data.map(item => ({
                permissionId: item.permission.permissionId,
                permission: item.permission.name,
                description: item.permission.description,
                type: item.type
            }))
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