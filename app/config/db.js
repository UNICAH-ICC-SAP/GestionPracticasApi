'use strict'

const config = require("../config/config");
const Sequelize = require("sequelize");
require('dotenv').config()
const fs = require("fs");

const sequelizeInstance = new Sequelize(process.env.DB, process.env.USER, process.env.PASSWORD, {
    host: process.env.HOST,
    dialect: process.env.DIALECT,
    port: process.env.PORT,
    dialectOptions: {
        connectTimeout: 100000
    },
    ssl: {
        rejectUnauthorized: true,
        ca: fs.readFileSync("./ca.pem").toString(),
    },
    operatorsAliases: "false",
    pool: {
        max: parseInt(process.env.POOL_MAX),
        min: parseInt(process.env.POOL_MIN),
        acquire: parseInt(process.env.POOL_ACQUIRE),
        idle: parseInt(process.env.POOL_IDLE)
    }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelizeInstance = sequelizeInstance;

db.users = require("../models/userModel")(sequelizeInstance, Sequelize);
db.docente = require("../models/docenteModel")(sequelizeInstance, Sequelize);
db.alumno = require("../models/alumnoModel")(sequelizeInstance, Sequelize);
db.facultad = require("../models/facultadModel")(sequelizeInstance, Sequelize);
db.role = require("../models/roleModel")(sequelizeInstance, Sequelize);
db.documentacion = require("../models/documentacionModel")(sequelizeInstance, Sequelize);
db.detalleDocumentacion = require("../models/detalleDocumentacionModel")(sequelizeInstance, Sequelize);
db.documento = require("../models/documentoModel")(sequelizeInstance, Sequelize);
db.terna = require("../models/ternaModel")(sequelizeInstance, Sequelize);
db.detalleTerna = require("../models/detalleTernaModel")(sequelizeInstance, Sequelize);

//alumno -< facultad
db.alumno.belongsTo(db.facultad, { foreignKey: { name: 'facultadId', } });
db.facultad.hasMany(db.alumno, { foreignKey: 'facultadId', sourceKey: 'facultadId' });

//ternas -< detalle
db.detalleTerna.belongsTo(db.terna, { foreignKey: { name: 'ternaId' } });
db.terna.hasMany(db.detalleTerna, { foreignKey: 'ternaId', sourceKey: 'ternaId' });
//ternas - alumno
db.terna.belongsTo(db.alumno, { foreignKey: { name: 'alumnoId' } });
db.alumno.hasOne(db.terna, { foreignKey: 'alumnoId', sourceKey: 'alumnoId' });
//docente -< facultad
db.docente.belongsTo(db.facultad, { foreignKey: { name: 'facultadId' } });
db.facultad.hasMany(db.docente, { foreignKey: 'facultadId', sourceKey: 'facultadId' });
//
db.docente.belongsTo(db.detalleTerna, { foreignKey: { name: 'docenteId' } });
db.detalleTerna.hasOne(db.docente, { foreignKey: 'docenteId', sourceKey: 'docenteId' })

module.exports = db;