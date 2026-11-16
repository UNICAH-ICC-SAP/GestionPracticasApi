'use strict';

const { Storage } = require('@google-cloud/storage');
const path = require('path');
const crypto = require('crypto');

const storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    credentials: {
        client_email: process.env.GCP_CLIENT_EMAIL,
        private_key: process.env.GCP_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
});

const bucketName = process.env.GCP_BUCKET_NAME;

const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp'
];

const MAX_FILE_SIZE = 50 * 1024 * 1024;

function sanitizeText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9-_]/g, '')
        .toLowerCase();
}

function sanitizeFileName(fileName) {
    const ext = path.extname(fileName);
    const baseName = path.basename(fileName, ext);

    return `${sanitizeText(baseName)}${ext.toLowerCase()}`;
}

function buildUserFolder(userId, userName) {
    const dni = sanitizeText(userId);
    const name = sanitizeText(userName);

    if (!dni || !name) {
        throw new Error('dniUser y userName son obligatorios');
    }

    return `${dni}-${name}`;
}

function validateFile(file) {
    if (!file || typeof file.fileName !== 'string' || !file.fileName.trim() ||
        !Number.isSafeInteger(Number(file.size)) || Number(file.size) <= 0) {
        throw new Error('fileName, contentType y size son obligatorios');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.contentType)) {
        throw new Error(`Tipo de archivo no permitido: ${file.contentType}`);
    }

    if (Number(file.size) > MAX_FILE_SIZE) {
        throw new Error(`El archivo ${file.fileName} supera los 50 MB`);
    }
}

async function generateSignedUrlByUser(params) {
    const { userId, userName, file } = params;

    validateFile(file);

    const userFolder = buildUserFolder(userId, userName);
    const safeFileName = sanitizeFileName(file.fileName);

    const storedName = `Gestion_Practicas/${userFolder}/${crypto.randomUUID()}-${safeFileName}`;

    const [uploadUrl] = await storage
        .bucket(bucketName)
        .file(storedName)
        .getSignedUrl({
            version: 'v4',
            action: 'write',
            expires: Date.now() + 15 * 60 * 1000,
            contentType: file.contentType
        });

    return {
        originalName: file.fileName,
        storedName,
        userFolder,
        mimeType: file.contentType,
        sizeBytes: file.size,
        bucketName,
        uploadUrl,
        fileUrl: `https://storage.googleapis.com/${bucketName}/${storedName}`
    };
}

async function verifyUploadedFile(file) {
    try {
        const [metadata] = await storage.bucket(bucketName).file(file.storedName).getMetadata();
        if (Number(metadata.size) !== Number(file.sizeBytes) || Number(metadata.size) > MAX_FILE_SIZE ||
            metadata.contentType !== file.mimeType || !ALLOWED_MIME_TYPES.includes(metadata.contentType)) {
            throw { status: 400, message: 'El archivo almacenado no coincide con el tamaño o tipo declarado.' };
        }
    } catch (error) {
        if (error.code === 404) throw { status: 400, message: 'El archivo todavía no se encuentra en el almacenamiento.' };
        throw error;
    }
}

async function generateDownloadSignedUrl(storedName) {
    const [downloadUrl] = await storage
        .bucket(bucketName)
        .file(storedName)
        .getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + 15 * 60 * 1000
        });

    return downloadUrl;
}


module.exports = {
    generateSignedUrlByUser,
    generateDownloadSignedUrl,
    verifyUploadedFile
};
