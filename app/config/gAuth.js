const { google } = require('googleapis');
const { Storage } = require('@google-cloud/storage');
// Ruta al archivo JSON con las credenciales de la cuenta de servicio
/*eslint-disable no-undef*/
const KEYFILEPATH = JSON.parse(process.env.GOOGLE_ACCESS_API);
const KEYFILEPATHBUCKET = JSON.parse(process.env.GOOGLE_ACCESS_BUCKET);
/*eslint-enable no-undef*/

const gAuth = {};

const SCOPES = ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/documents'];

// Crear un cliente autenticado
gAuth.googleApis = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: SCOPES,
});

gAuth.storage = new Storage({
    credentials: KEYFILEPATHBUCKET,
});

module.exports = gAuth;