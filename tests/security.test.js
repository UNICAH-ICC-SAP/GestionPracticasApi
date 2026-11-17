'use strict';

jest.mock('../app/config/db', () => ({
    Sequelize: require('sequelize'),
    users: { findByPk: jest.fn(), create: jest.fn(), update: jest.fn() },
    permissions: { findOne: jest.fn() },
    userPermission: { findOne: jest.fn(), create: jest.fn() },
    rolePermission: { findOne: jest.fn(), create: jest.fn(), findAll: jest.fn() },
    alumno: { findAll: jest.fn(), create: jest.fn() },
    docente: { findAll: jest.fn(), create: jest.fn() },
    facultad: { findByPk: jest.fn() },
    terna: { findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
    detalleTerna: { findOne: jest.fn(), findAll: jest.fn(), bulkCreate: jest.fn() },
    file: { findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn(), findAll: jest.fn() },
    plantilla_correo: { findAll: jest.fn(), findByPk: jest.fn(), update: jest.fn() },
    accionCorreo: { findOne: jest.fn() },
    detalle_periodo: { findAll: jest.fn() },
    sequelizeInstance: { transaction: jest.fn() }
}));

jest.mock('../app/services/gcpBucketService', () => ({
    generateSignedUrlByUser: jest.fn(),
    generateDownloadSignedUrl: jest.fn(),
    verifyUploadedFile: jest.fn()
}));

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jwt-simple');
const db = require('../app/config/db');
const tokens = require('../app/services/tokenService');
const storage = require('../app/services/gcpBucketService');
const access = require('../app/services/accessService');

let server;
let baseUrl;
let users;
let originalSecret;

beforeAll(async () => {
    originalSecret = process.env.SECRET_TOKEN;
    process.env.SECRET_TOKEN = 'security-tests-only-secret';
    const app = express();
    app.use(express.json());
    app.use('/user', require('../app/routes/userRoutes'));
    app.use('/files', require('../app/routes/fileRoutes'));
    app.use('/roles', require('../app/routes/rolePermissionsRoutes'));
    app.use('/permissions', require('../app/routes/userPermissionRoutes'));
    app.use('/alumno', require('../app/routes/alumnoRoutes'));
    app.use('/docente', require('../app/routes/docenteRoutes'));
    app.use('/ternas', require('../app/routes/ternaRoutes'));
    app.use('/detalle', require('../app/routes/detalleTernaRoutes'));
    app.use('/correo', require('../app/routes/enviarCorreoRoutes'));
    app.use('/secciones', require('../app/routes/seccionesRoutes'));
    app.use('/cargas/importar', require('../app/routes/cargaImportRoutes'));
    await new Promise(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

beforeEach(async () => {
    jest.resetAllMocks();
    const pass = await bcrypt.hash('Current-password-123', 4);
    users = {
        '1': { userId: '1', roleId: 1, pass, passwordResetRequired: false },
        '2': { userId: '2', roleId: 2, pass, passwordResetRequired: false },
        '3': { userId: '3', roleId: 3, pass, passwordResetRequired: false },
        '4': { userId: '4', roleId: 3, pass, passwordResetRequired: false },
        '5': { userId: '5', roleId: 3, pass, passwordResetRequired: true },
    };
    db.users.findByPk.mockImplementation(async id => users[id] ? { ...users[id] } : null);
    db.users.create.mockImplementation(async data => ({ ...data }));
    db.users.update.mockImplementation(async (data, { where }) => {
        const user = users[where.userId];
        if (!user || user.pass !== where.pass ||
            (where.passwordResetRequired !== undefined && user.passwordResetRequired !== where.passwordResetRequired)) return [0];
        Object.assign(user, data);
        return [1];
    });
    db.permissions.findOne.mockResolvedValue(null);
    db.userPermission.findOne.mockResolvedValue(null);
    db.rolePermission.findOne.mockResolvedValue(null);
    db.terna.findAll.mockResolvedValue([]);
    db.detalleTerna.findAll.mockResolvedValue([]);
    db.detalleTerna.findOne.mockResolvedValue(null);
    db.alumno.findAll.mockResolvedValue([]);
    db.docente.findAll.mockResolvedValue([]);
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

afterAll(async () => {
    await new Promise(resolve => server.close(resolve));
    if (originalSecret === undefined) delete process.env.SECRET_TOKEN;
    else process.env.SECRET_TOKEN = originalSecret;
});

async function request(method, path, body, userId, token) {
    const response = await fetch(baseUrl + path, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(userId || token ? { Authorization: `Bearer ${token || tokens.createToken(users[userId])}` } : {})
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    return { status: response.status, body: await response.json() };
}

test('teachers can read their sections but cannot impersonate another teacher', async () => {
    db.detalle_periodo.findAll.mockResolvedValue([]);
    expect((await request('GET', '/secciones/getSections?id_periodo=III-2026', undefined, '2')).status).toBe(200);
    expect(db.detalle_periodo.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: { id_periodo: 'III-2026', docenteId: '2' }
    }));
    db.detalle_periodo.findAll.mockClear();
    expect((await request('GET', '/secciones/getSections?id_periodo=III-2026&docenteId=1', undefined, '2')).status).toBe(403);
    expect((await request('GET', '/secciones/getSections?id_periodo=III-2026', undefined, '3')).status).toBe(403);
    expect(db.detalle_periodo.findAll).not.toHaveBeenCalled();
});

test('administrators retain section access and teachers cannot mutate sections', async () => {
    db.detalle_periodo.findAll.mockResolvedValue([]);
    expect((await request('GET', '/secciones/getSections?id_periodo=III-2026', undefined, '1')).status).toBe(200);
    expect(db.detalle_periodo.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: { id_periodo: 'III-2026' }
    }));
    for (const [method, path] of [['POST', 'insertSection'], ['PUT', 'updateSection'], ['DELETE', 'deleteSection']]) {
        expect((await request(method, `/secciones/${path}`, {}, '2')).status).toBe(403);
    }
});

test('password reset and account creation reject anonymous requests', async () => {
    expect((await request('PUT', '/user/resetPassword', { newPassword: 'New-password-123' })).status).toBe(401);
    expect((await request('POST', '/user/signUp', { userId: '6', accountType: 'alumno' })).status).toBe(401);
    expect(db.users.update).not.toHaveBeenCalled();
    expect(db.users.create).not.toHaveBeenCalled();
});

test('academic import preview, confirm and export require an administrator', async () => {
    for (const endpoint of ['preview', 'confirm', 'excel']) {
        expect((await request('POST', `/cargas/importar/${endpoint}`, {})).status).toBe(401);
        expect((await request('POST', `/cargas/importar/${endpoint}`, {}, '2')).status).toBe(403);
        expect((await request('POST', `/cargas/importar/${endpoint}`, {}, '3')).status).toBe(403);
    }
});

test('students cannot create accounts or grant role/user permissions', async () => {
    for (const path of ['/user/signUp', '/user/register', '/user/invitation', '/roles/insertRolePermission', '/permissions/insertUserPermission']) {
        expect((await request('POST', path, { userId: '6', roleId: 1, permissionId: 1 }, '3')).status).toBe(403);
    }
    expect(db.users.create).not.toHaveBeenCalled();
    expect(db.rolePermission.create).not.toHaveBeenCalled();
    expect(db.userPermission.create).not.toHaveBeenCalled();
});

test('renewing an invitation invalidates the previous password, session and invitation', async () => {
    const session = tokens.createToken(users['3']);
    const previous = tokens.createInvitation(users['3']);
    const response = await request('POST', '/user/invitation', { userId: '3' }, '1');
    expect(response.status).toBe(200);
    expect(users['3'].passwordResetRequired).toBe(true);
    expect((await request('GET', '/user/whoAmI', undefined, undefined, session)).status).toBe(401);
    expect((await request('POST', '/user/activate', { invitationToken: previous, newPassword: 'New-password-123' })).status).toBe(401);
    expect((await request('POST', '/user/activate', {
        invitationToken: response.body.invitationToken, newPassword: 'New-password-123'
    })).status).toBe(200);
});

test('server assigns the account role and never returns the password hash', async () => {
    const result = await request('POST', '/user/signUp', { userId: '6', accountType: 'alumno', roleId: 1, pass: 'shared-password' }, '1');
    expect(result.status).toBe(201);
    expect(result.body.roleId).toBe(3);
    expect(result.body.pass).toBeUndefined();
    expect(db.users.create).toHaveBeenCalledWith(expect.objectContaining({ roleId: 3, passwordResetRequired: true }));
    expect((await tokens.decodeToken(result.body.invitationToken, 'invitation')).sub).toBe('6');
});

test('reset rejects another user and an incorrect current password', async () => {
    expect((await request('PUT', '/user/resetPassword?userId=4', {
        currentPassword: 'Current-password-123', newPassword: 'New-password-123'
    }, '3')).status).toBe(403);
    expect((await request('PUT', '/user/resetPassword', {
        currentPassword: 'incorrect', newPassword: 'New-password-123'
    }, '3')).status).toBe(401);
    expect(db.users.update).not.toHaveBeenCalled();
});

test('changing a password invalidates existing access tokens', async () => {
    const token = tokens.createToken(users['3']);
    const result = await request('PUT', '/user/resetPassword', {
        currentPassword: 'Current-password-123', newPassword: 'New-password-123'
    }, undefined, token);
    expect(result.status).toBe(200);
    expect(await bcrypt.compare('New-password-123', users['3'].pass)).toBe(true);
    expect((await request('GET', '/user/whoAmI', undefined, undefined, token)).status).toBe(401);
});

test('invitation activates only once and cannot be used as an access token', async () => {
    const token = tokens.createInvitation(users['5']);
    expect((await request('GET', '/user/whoAmI', undefined, undefined, token)).status).toBe(401);
    const data = { invitationToken: token, newPassword: 'New-password-123' };
    expect((await request('POST', '/user/activate', data)).status).toBe(200);
    expect((await request('POST', '/user/activate', data)).status).toBe(401);
    expect(users['5'].passwordResetRequired).toBe(false);
});

test('malformed, expired and legacy tokens return 401 without leaving requests open', async () => {
    for (const token of ['invalid', jwt.encode({ sub: '3', exp: 1 }, process.env.SECRET_TOKEN),
        jwt.encode({ sub: '3', exp: Math.floor(Date.now() / 1000) + 60 }, process.env.SECRET_TOKEN)]) {
        expect((await request('GET', '/user/whoAmI', undefined, undefined, token)).status).toBe(401);
    }
});

test('accounts requiring a password change cannot access protected resources', async () => {
    expect((await request('GET', '/user/whoAmI', undefined, '5')).status).toBe(200);
    expect((await request('POST', '/files/list', { userId: '5' }, '5')).status).toBe(403);
});

test('invalid login never selects an arbitrary account and uses a generic error', async () => {
    expect((await request('POST', '/user/login', { pass: 'Current-password-123' })).status).toBe(400);
    expect(db.users.findByPk).not.toHaveBeenCalled();
    const missing = await request('POST', '/user/login', { userId: '9', pass: 'incorrect' });
    const incorrect = await request('POST', '/user/login', { userId: '3', pass: 'incorrect' });
    expect(missing).toEqual(incorrect);
    expect(missing.status).toBe(401);
});

test('a student cannot read or modify another student document', async () => {
    const file = { userId: '4', status: 'UPLOADED', update: jest.fn() };
    db.file.findByPk.mockResolvedValue(file);
    db.file.findOne.mockResolvedValue(file);
    for (const [method, path, body] of [
        ['POST', '/files/list', { userId: '4' }],
        ['POST', '/files/download-url', { archivoId: 1 }],
        ['PATCH', '/files/updateFileStatus', { id: 1, status: 'UPLOADED' }],
        ['POST', '/files/update-signed-urls', { archivoId: 1, fileTypeId: 1, file: {} }],
        ['POST', '/files/signed-urls', { userId: '4', file: {} }],
    ]) {
        expect((await request(method, path, body, '3')).status).toBe(403);
    }
    expect(file.update).not.toHaveBeenCalled();
    expect(storage.generateDownloadSignedUrl).not.toHaveBeenCalled();
    expect(storage.generateSignedUrlByUser).not.toHaveBeenCalled();
});

test('only assigned teachers may access a student document', async () => {
    db.file.findByPk.mockResolvedValue({ userId: '3', status: 'UPLOADED', storedName: 'file.pdf' });
    db.terna.findAll.mockResolvedValue([{ ternaId: 10 }]);
    expect((await request('POST', '/files/download-url', { archivoId: 1 }, '2')).status).toBe(403);
    db.detalleTerna.findOne.mockResolvedValue({ docenteId: '2', ternaId: 10 });
    storage.generateDownloadSignedUrl.mockResolvedValue('signed-url');
    expect((await request('POST', '/files/download-url', { archivoId: 1 }, '2')).status).toBe(200);
});

test('uploaded state requires verification and students cannot request review changes', async () => {
    const file = { userId: '3', update: jest.fn() };
    db.file.findByPk.mockResolvedValue(file);
    expect((await request('PATCH', '/files/updateFileStatus', { id: 1, fileStatus: 'CHANGE_REQUESTED' }, '3')).status).toBe(403);
    storage.verifyUploadedFile.mockRejectedValue({ status: 400, message: 'Missing upload' });
    expect((await request('PATCH', '/files/updateFileStatus', { id: 1, status: 'UPLOADED' }, '3')).status).toBe(400);
    expect(file.update).not.toHaveBeenCalled();
});

test('students cannot inspect other user permissions', async () => {
    expect((await request('POST', '/permissions/getUserPermissionsByUser', { userId: '4' }, '3')).status).toBe(403);
    expect((await request('POST', '/roles/getRolesGrouped', { roleId: 1 }, '3')).status).toBe(403);
});

test('read filters cannot override the authenticated student scope', async () => {
    db.alumno.findAll.mockResolvedValue([{ alumnoId: '3', nombre: 'Alumno' }]);
    expect((await request('GET', '/alumno/getAlumnosBy?alumnoId=4', undefined, '3')).status).toBe(201);
    expect(db.alumno.findAll).toHaveBeenCalledWith(expect.objectContaining({ where: { alumnoId: '3' } }));
    await request('GET', '/alumno/getAllData?alumnoId=4', undefined, '3');
    expect(db.alumno.findAll).toHaveBeenCalledWith(expect.objectContaining({ where: { alumnoId: '3' } }));
    await request('GET', '/ternas/getTernaBy?alumnoId=4', undefined, '3');
    expect(db.terna.findAll).toHaveBeenCalledWith(expect.objectContaining({ where: { alumnoId: '3' } }));
});

test('teacher lists preserve the faculty filter and authenticated access scope', async () => {
    const result = await request('GET', '/docente/getDocentes?facultadId=ING', undefined, '3');
    expect(result.status).toBe(200);
    expect(db.docente.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: {
            estadoDocente: 1,
            facultadId: 'ING',
            docenteId: { [db.Sequelize.Op.in]: ['3'] }
        }
    }));
});

test('profile lookup preserves the requested teacher within the allowed teachers', async () => {
    db.terna.findAll.mockResolvedValue([{ ternaId: 7 }]);
    db.detalleTerna.findAll.mockImplementation(async options =>
        options.attributes.includes('docenteId') ? [{ docenteId: '9599' }, { docenteId: '1000' }] : [{ ternaId: 7 }]);
    db.docente.findAll.mockResolvedValue([{ docenteId: '9599', nombre: 'Ariel Antonio Calix Vásquez' }]);

    const result = await request('GET', '/docente/getDocentesBy?docenteId=9599', undefined, '2');

    expect(result.status).toBe(201);
    expect(result.body).toMatchObject({ userId: '9599', nombre: 'Ariel Antonio Calix Vásquez' });
    expect(db.docente.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: { [db.Sequelize.Op.and]: [
            { docenteId: '9599' },
            { docenteId: { [db.Sequelize.Op.in]: ['2', '9599', '1000'] } }
        ] }
    }));
});

test('an unavailable teacher profile returns 404 instead of selecting another profile', async () => {
    const result = await request('GET', '/docente/getDocentesBy?docenteId=9599', undefined, '2');
    expect(result.status).toBe(404);
    expect(result.body.nombre).toBeUndefined();
});

test('explicit permission denial takes precedence over a role grant', async () => {
    db.permissions.findOne.mockResolvedValue({ permissionId: 7 });
    db.userPermission.findOne.mockResolvedValue({ type: 'DENY' });
    db.rolePermission.findOne.mockResolvedValue({ permissionId: 7 });
    expect(await access.hasPermission(users['2'], 'CONFIG_EMAIL_TEMPLATE')).toBe(false);
});

test('template responses omit SMTP credentials and unauthorized users are denied', async () => {
    expect((await request('GET', '/correo/obtenerPlantillas', undefined, '3')).status).toBe(403);
    db.permissions.findOne.mockResolvedValue({ permissionId: 7 });
    db.plantilla_correo.findAll.mockImplementation(async ({ attributes }) => {
        expect(attributes).not.toContain('correo_password');
        return [{ Id_correo: 1, cuerpo: '<p>Hola</p>' }];
    });
    const result = await request('GET', '/correo/obtenerPlantillas', undefined, '1');
    expect(result.status).toBe(200);
    expect(JSON.stringify(result.body)).not.toContain('correo_password');
});

test('editing a template without a new SMTP password preserves the stored credential', async () => {
    db.permissions.findOne.mockResolvedValue({ permissionId: 7 });
    db.plantilla_correo.update.mockResolvedValue([1]);
    db.plantilla_correo.findByPk.mockResolvedValue({ Id_correo: 1, asunto: 'Nuevo asunto' });
    const result = await request('PUT', '/correo/actualizarPlantilla/1', {
        correo_origen: 'sender@example.com', correo_password: '', asunto: 'Nuevo asunto', cuerpo: '<p>Hola</p>'
    }, '1');
    expect(result.status).toBe(200);
    expect(db.plantilla_correo.update.mock.calls[0][0]).not.toHaveProperty('correo_password');
    expect(db.plantilla_correo.findByPk).toHaveBeenCalledWith('1', expect.objectContaining({
        attributes: ['Id_correo', 'correo_origen', 'asunto', 'cuerpo']
    }));
});

test.each(['short', '😀'.repeat(25)])('activation rejects passwords outside bcrypt limits', async newPassword => {
    const result = await request('POST', '/user/activate', {
        invitationToken: tokens.createInvitation(users['5']), newPassword
    });
    expect(result.status).toBe(400);
    expect(db.users.update).not.toHaveBeenCalled();
});

test('registration uses a single transaction for user, profile, terna and details', async () => {
    const transaction = { id: 'test-transaction' };
    db.sequelizeInstance.transaction.mockImplementation(callback => callback(transaction));
    db.facultad.findByPk.mockResolvedValue({ facultadId: 'ING' });
    db.docente.findAll.mockResolvedValue([{ docenteId: '10' }, { docenteId: '11' }, { docenteId: '12' }]);
    db.terna.create.mockResolvedValue({ ternaId: 25 });
    const result = await request('POST', '/user/register', {
        accountType: 'alumno',
        profile: { alumnoId: '6', nombre: 'Alumno', email: 'alumno@example.com', facultadId: 'ING', telefono: '50499999999' },
        detalleTernas: [{ docenteId: '10', rol: 'coordina' }, { docenteId: '11', rol: 'estilo' }, { docenteId: '12', rol: 'tecnico' }]
    }, '1');
    expect(result.status).toBe(201);
    expect(result.body.ternaId).toBe(25);
    for (const create of [db.users.create, db.alumno.create, db.terna.create, db.detalleTerna.bulkCreate]) {
        expect(create).toHaveBeenCalledWith(expect.anything(), { transaction });
    }
});

test('registration does not return a successful account or invitation after a detail failure', async () => {
    db.sequelizeInstance.transaction.mockImplementation(callback => callback({}));
    db.facultad.findByPk.mockResolvedValue({});
    db.docente.findAll.mockResolvedValue([{}, {}, {}]);
    db.terna.create.mockResolvedValue({ ternaId: 25 });
    db.detalleTerna.bulkCreate.mockRejectedValue(new Error('database failed'));
    const result = await request('POST', '/user/register', {
        accountType: 'alumno',
        profile: { alumnoId: '6', nombre: 'Alumno', email: 'alumno@example.com', facultadId: 'ING', telefono: '50499999999' },
        detalleTernas: [{ docenteId: '10', rol: 'coordina' }, { docenteId: '11', rol: 'estilo' }, { docenteId: '12', rol: 'tecnico' }]
    }, '1');
    expect(result.status).toBe(500);
    expect(result.body.invitationToken).toBeUndefined();
});
