// app/controllers/file.controller.js
'use strict';

const db = require('../config/db');
const UploadedFile = db.file;

const { generateSignedUrlByUser, generateDownloadSignedUrl } = require('../services/gcpBucketService');

async function createSignedUrlUser(req, res) {
    try {
        const { userId, userName, file, fileTypeId, customFileName } = req.body;

        if (!file) {
            return res.status(400).send({
                message: 'El archivo es requerido'
            });
        }

        const signedFile = await generateSignedUrlByUser({
            userId,
            userName,
            file: {
                ...file,
                fileName: customFileName
            },
        });

        const record = await UploadedFile.create({
            userId,
            userName,
            userFolder: signedFile.userFolder,
            originalName: signedFile.originalName,
            storedName: signedFile.storedName,
            mimeType: signedFile.mimeType,
            sizeBytes: signedFile.sizeBytes,
            provider: 'GCP',
            bucketName: signedFile.bucketName,
            fileUrl: signedFile.fileUrl,
            status: 'PENDING',
            fileStatus: 'DELIVERED',
            fileTypeId
        });

        return res.status(200).send({
            message: 'URL firmada generada correctamente',
            file: {
                archivoId: record.archivoId,
                originalName: signedFile.originalName,
                storedName: signedFile.storedName,
                userFolder: signedFile.userFolder,
                uploadUrl: signedFile.uploadUrl,
                fileUrl: signedFile.fileUrl,
                fileTypeId
            }
        });

    } catch (error) {
        console.error(error);

        return res.status(400).send({
            message: error.message || 'Error al generar URL firmada'
        });
    }
}

async function updateCreateSignedUrlUser(req, res) {
    try {
        const { archivoId, fileTypeId, userId, userName, file, customFileName } = req.body;

        if (!archivoId || !fileTypeId) {
            return res.status(400).send({
                message: 'archivoId y fileTypeId son requeridos'
            });
        }

        if (!file) {
            return res.status(400).send({
                message: 'El archivo es requerido'
            });
        }

        const currentFile = await UploadedFile.findOne({
            where: {
                archivoId,
                fileTypeId
            }
        });

        if (!currentFile) {
            return res.status(404).send({
                message: 'Archivo no encontrado'
            });
        }

        const signedFile = await generateSignedUrlByUser({
            userId: userId || currentFile.userId,
            userName: userName || currentFile.userName,
            file: {
                ...file,
                fileName: customFileName || file.fileName
            }
        });

        await currentFile.update({
            userId: userId || currentFile.userId,
            userName: userName || currentFile.userName,
            userFolder: signedFile.userFolder,
            originalName: signedFile.originalName,
            storedName: signedFile.storedName,
            mimeType: signedFile.mimeType,
            sizeBytes: signedFile.sizeBytes,
            provider: 'GCP',
            bucketName: signedFile.bucketName,
            fileUrl: signedFile.fileUrl,
            status: 'PENDING',
            fileStatus: 'DELIVERED'
        });

        return res.status(200).send({
            message: 'URL firmada actualizada correctamente',
            file: {
                archivoId: currentFile.archivoId,
                originalName: signedFile.originalName,
                storedName: signedFile.storedName,
                userFolder: signedFile.userFolder,
                uploadUrl: signedFile.uploadUrl,
                fileUrl: signedFile.fileUrl,
                fileTypeId: currentFile.fileTypeId
            }
        });

    } catch (error) {
        console.error(error);

        return res.status(400).send({
            message: error.message || 'Error al actualizar URL firmada'
        });
    }
}

async function getDownloadUrl(req, res) {
    try {
        const { archivoId } = req.body;

        if (!archivoId) {
            return res.status(400).send({
                message: 'archivoId es requerido'
            });
        }

        const archivo = await UploadedFile.findByPk(archivoId);

        if (!archivo) {
            return res.status(404).send({
                message: 'Archivo no encontrado'
            });
        }

        if (archivo.status !== 'UPLOADED') {
            return res.status(400).send({
                message: 'El archivo aún no ha sido subido'
            });
        }

        const downloadUrl = await generateDownloadSignedUrl(archivo.storedName);

        return res.status(200).send({
            archivoId: archivo.archivoId,
            originalName: archivo.originalName,
            downloadUrl
        });

    } catch (error) {
        console.error(error);

        return res.status(500).send({
            message: 'Error generando URL de descarga'
        });
    }
}

async function updateFileStatus(req, res) {
    try {
        const { id, status, fileStatus } = req.body;

        const file = await UploadedFile.findByPk(id);

        if (!file) {
            return res.status(404).send({
                message: 'Archivo no encontrado'
            });
        }

        await file.update({
            status,
            fileStatus
        });

        return res.status(200).send({
            message: `Archivo actualizado.`
        });

    } catch (error) {
        console.error(error);

        return res.status(500).send({
            message: 'Error actualizando archivo'
        });
    }
}

async function findAllByUser(req, res) {
    try {
        const { userId, status } = req.body;

        if (!userId) {
            return res.status(400).send({
                message: 'userId es requerido'
            });
        }

        const where = { userId };

        if (status) {
            where.status = status;
        }

        const archivos = await UploadedFile.findAll({
            where,
            // order: [['archivoId', 'DESC']]
        });

        const groupedUsers = {};

        archivos.forEach((archivo) => {
            const item = archivo.toJSON();

            const key = item.userId;

            if (!groupedUsers[key]) {
                groupedUsers[key] = {
                    userId: item.userId,
                    userName: item.userName,
                    userFolder: item.userFolder,
                    files: []
                };
            }

            groupedUsers[key].files.push({
                archivoId: item.archivoId,
                originalName: item.originalName,
                storedName: item.storedName,
                mimeType: item.mimeType,
                sizeBytes: item.sizeBytes,
                provider: item.provider,
                bucketName: item.bucketName,
                fileUrl: item.fileUrl,
                status: item.status,
                fileStatus: item.fileStatus,
                fileTypeId: item.fileTypeId
            });
        });

        const data = Object.values(groupedUsers);

        return res.status(200).send({
            totalFiles: archivos.length,
            data
        });

    } catch (error) {
        console.error(error);

        return res.status(500).send({
            message: 'Error obteniendo archivos'
        });
    }
}

module.exports = {
    createSignedUrlUser,
    updateFileStatus,
    findAllByUser,
    getDownloadUrl,
    updateCreateSignedUrlUser
};