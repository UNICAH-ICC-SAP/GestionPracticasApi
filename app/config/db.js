'use strict'

const Sequelize = require("sequelize");
require('dotenv').config()
const fs = require("fs");

/*eslint-disable no-undef*/
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
/*eslint-enable no-undef*/
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
db.clases = require("../models/pensumModel")(sequelizeInstance, Sequelize);
db.carrera_clase_bloque = require("../models/ccbModel")(sequelizeInstance, Sequelize);


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

//carrera_clase_bloque -< clases
db.carrera_clase_bloque.belongsTo(db.clases, { foreignKey: 'id_clase', targetKey: 'id_clase' });
db.clases.hasMany(db.carrera_clase_bloque, { foreignKey: 'id_clase' });


module.exports = db;