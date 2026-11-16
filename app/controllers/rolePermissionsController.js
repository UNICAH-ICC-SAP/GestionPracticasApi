'use strict'

const db = require('../config/db');

const RolePermission = db.rolePermission;
const Permission = db.permissions;

// 🔍 Obtener todos los roles con sus permisos
async function findAll(req, res) {
    try {
        const data = await RolePermission.findAll({
            include: [Permission]
        });

        res.status(200).send(data);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message || "Error al obtener roles-permisos"
        });
    }
}

// 🔍 Obtener permisos por rol
async function findByRole(req, res) {
    try {
        const { roleId } = req.query;

        if (!roleId) {
            return res.status(400).send({
                message: "roleId es requerido"
            });
        }

        const data = await RolePermission.findAll({
            where: { roleId },
            include: [Permission]
        });

        res.status(200).send(data);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message || "Error al obtener permisos del rol"
        });
    }
}

// ➕ Asignar permiso a rol
async function insert(req, res) {
    try {
        const { roleId, permissionId } = req.body;

        if (!roleId || !permissionId) {
            return res.status(400).send({
                message: "roleId y permissionId son requeridos"
            });
        }

        const exists = await RolePermission.findOne({
            where: { roleId, permissionId }
        });

        if (exists) {
            return res.status(409).send({
                message: "El permiso ya está asignado a este rol"
            });
        }

        const data = await RolePermission.create({
            roleId,
            permissionId
        });

        res.status(200).send(data);

    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message || "Error al asignar permiso al rol"
        });
    }
}

// ❌ Eliminar permiso de un rol
async function remove(req, res) {
    try {
        const { roleId, permissionId } = req.query;

        if (!roleId || !permissionId) {
            return res.status(400).send({
                message: "roleId y permissionId son requeridos"
            });
        }

        const num = await RolePermission.destroy({
            where: { roleId, permissionId }
        });

        if (num === 1) {
            return res.status(200).send({
                message: "Permiso eliminado correctamente"
            });
        }

        res.status(404).send({
            message: "No se encontró el registro"
        });

    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message || "Error al eliminar permiso"
        });
    }
}

async function findRolesWithPermissions(req, res) {
    try {
        const { roleId } = req.body;;

        if (!roleId) {
            return res.status(400).send({
                message: "roleId es requerido"
            });
        }

        const where = {};
        if (roleId) {
            where.roleId = roleId;
        }

        const data = await db.role.findAll({
            where,
            include: [{
                model: db.permissions,
                through: { attributes: [] } // oculta la tabla pivote
            }]
        });

        res.status(200).send(data);

    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message || "Error al obtener roles con permisos"
        });
    }
}

module.exports = {
    findAll,
    findByRole,
    insert,
    remove,
    findRolesWithPermissions
};