const { Buffer } = require('buffer')
const gAuth = require("../config/gAuth")

async function uploadDocument(req, res) {
    const { userId, fileName, fileContent } = req.body;
    const storage = gAuth.storage;
    /*eslint-disable no-undef*/
    const bucket = storage.bucket(process.env.BUCKET_NAME);
    /*eslint-enable no-undef*/
    const folderPrefix = `${userId}/`;

    const files = await bucket.getFiles({ prefix: folderPrefix, delimiter: '/' });

    if (files.length === 0) {
        console.info("Creando Carpeta");
        await bucket.file(`${folderPrefix}`).save();
        console.info("Carpeta Creada")
    }
    const nfileContent = new Buffer.from(fileContent, "base64");
    const file = bucket.file(`${folderPrefix}${fileName}`);
    await file.save(nfileContent)
        .then(result => {
            res.status(200).send({ message: "Archivo guardado", result })
        })
        .catch(error => {
            res.status(500).send({ message: "Archivo guardado", error })
        });

}

async function downloadDocument(req, res) {
    const { userId, fileName } = req.body;
    /*eslint-disable no-undef*/
    const bucket = gAuth.storage.bucket(process.env.BUCKET_NAME);
    /*eslint-enable no-undef*/
    const folderPrefix = `${userId}/`;

    const file = bucket.file(`${folderPrefix}${fileName}`);
    await file.download()
        .then(([fileBuffer]) => {
            res.status(200).send({ fileName, content: fileBuffer.toString('base64') });
        })
        .catch(error => {
            res.status(500).send(error);
        });


}

async function getFiles(req, res) {
    const { userId } = req.body;
    /*eslint-disable no-undef*/
    const bucket = gAuth.storage.bucket(process.env.BUCKET_NAME);
    /*eslint-enable no-undef*/
    const folderPrefix = `${userId}/`;

    bucket.getFiles({ prefix: folderPrefix })
        .then(result => {
            const [files] = result;
            console.log(files)
            const fileNames = files.map(file => file.name.split("/")[1]);
            res.status(200).send({ userId, fileNames });
        })
        .catch(error => {
            res.status(error.code).send(error.message);
        });
}

module.exports = { uploadDocument, downloadDocument, getFiles };