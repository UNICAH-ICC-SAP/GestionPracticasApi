'use strict';

jest.mock('@google-cloud/storage', () => {
    const file = { getSignedUrl: jest.fn(), getMetadata: jest.fn() };
    return { Storage: jest.fn(() => ({ bucket: () => ({ file: () => file }) })), file };
});

process.env.GCP_PRIVATE_KEY = 'test-key';
const storage = require('@google-cloud/storage').file;
const service = require('../app/services/gcpBucketService');

beforeEach(() => {
    storage.getSignedUrl.mockResolvedValue(['signed-url']);
});

test.each([0, -1, 'invalid', 1.5, 51 * 1024 * 1024])('rejects invalid upload size %s', async size => {
    await expect(service.generateSignedUrlByUser({
        userId: '3', userName: 'Alumno', file: { fileName: 'file.pdf', size, contentType: 'application/pdf' }
    })).rejects.toThrow();
});

test('rejects forbidden MIME types', async () => {
    await expect(service.generateSignedUrlByUser({
        userId: '3', userName: 'Alumno', file: { fileName: 'file.html', size: 10, contentType: 'text/html' }
    })).rejects.toThrow();
});

test('identical filenames generate separate storage objects', async () => {
    const data = { userId: '3', userName: 'Alumno', file: { fileName: 'file.pdf', size: 10, contentType: 'application/pdf' } };
    const first = await service.generateSignedUrlByUser(data);
    const second = await service.generateSignedUrlByUser(data);
    expect(first.storedName).not.toBe(second.storedName);
});

test('upload confirmation rejects mismatched metadata', async () => {
    storage.getMetadata.mockResolvedValue([{ size: '100', contentType: 'application/pdf' }]);
    await expect(service.verifyUploadedFile({
        storedName: 'file.pdf', sizeBytes: 10, mimeType: 'application/pdf'
    })).rejects.toMatchObject({ status: 400 });
});

test('upload confirmation rejects nonexistent objects', async () => {
    storage.getMetadata.mockRejectedValue({ code: 404 });
    await expect(service.verifyUploadedFile({ storedName: 'file.pdf' })).rejects.toMatchObject({ status: 400 });
});