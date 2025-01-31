'use strict'

const Sequelize = require("sequelize");
require('dotenv').config();
const fs = require("fs");

/*eslint-disable no-undef*/
const sequelizeInstance = new Sequelize(process.env.DB, process.env.USER, process.env.PASSWORD, {
    host: process.env.HOST,
    dialect: process.env.DIALECT,
    port: process.env.MY_SQL_PORT,
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

// Cargar los modelos
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
db.clases = require("../models/claseModel")(sequelizeInstance, Sequelize);
db.carrera_clase_bloque = require("../models/carreraClaseBloqueModel")(sequelizeInstance, Sequelize);
db.periodos = require("../models/periodoModel")(sequelizeInstance, Sequelize);
db.secciones = require("../models/seccionesModel")(sequelizeInstance, Sequelize);
db.detalle_periodo = require("../models/seccionesModel")(sequelizeInstance, Sequelize);
db.plantilla_correo = require("../models/enviarCorreoModel")(sequelizeInstance, Sequelize);
db.accionCorreo = require("../models/plantillaAccionModel")(sequelizeInstance, Sequelize);

// Relaciones

// Accion >- Plantilla
db.accionCorreo.belongsTo(db.plantilla_correo, { foreignKey: { name: 'plantillaCorreoId' } });
db.plantilla_correo.hasMany(db.accionCorreo, { foreignKey: 'plantillaCorreoId', sourceKey: 'Id_correo' });
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
//alumno -< facultad
db.alumno.belongsTo(db.facultad, { foreignKey: { name: 'facultadId' } });
db.facultad.hasMany(db.alumno, { foreignKey: 'facultadId', sourceKey: 'facultadId' });

// Terna -< DetalleTerna
db.detalleTerna.belongsTo(db.terna, { foreignKey: { name: 'ternaId' } });
db.terna.hasMany(db.detalleTerna, { foreignKey: 'ternaId', sourceKey: 'ternaId' });

// Terna - Alumno
db.terna.belongsTo(db.alumno, { foreignKey: { name: 'alumnoId' } });
db.alumno.hasOne(db.terna, { foreignKey: 'alumnoId', sourceKey: 'alumnoId' });

// Docente -< Facultad
db.docente.belongsTo(db.facultad, { foreignKey: { name: 'facultadId' } });
db.facultad.hasMany(db.docente, { foreignKey: 'facultadId', sourceKey: 'facultadId' });

// Docente -< DetalleTerna
db.docente.belongsTo(db.detalleTerna, { foreignKey: { name: 'docenteId' } });
db.detalleTerna.hasOne(db.docente, { foreignKey: 'docenteId', sourceKey: 'docenteId' });

// CarreraClaseBloque -< Clases
db.carrera_clase_bloque.belongsTo(db.clases, { foreignKey: 'id_clase', targetKey: 'id_clase' });
db.clases.hasMany(db.carrera_clase_bloque, { foreignKey: 'id_clase' });

// CarreraClaseBloque -< Facultad
db.carrera_clase_bloque.belongsTo(db.facultad, { foreignKey: 'facultadId', as: 'facultad' });
db.facultad.hasMany(db.carrera_clase_bloque, { foreignKey: 'facultadId', sourceKey: 'facultadId' });

// DetallePeriodo -< CarreraClaseBloque
db.detalle_periodo.belongsTo(db.carrera_clase_bloque, {
    foreignKey: 'id_ccb',  // El campo en detalle_periodo que hace referencia a carrera_clase_bloque
    targetKey: 'id_ccb',   // La clave primaria de carrera_clase_bloque
    as: 'ccb'              // Alias para referirse a carrera_clase_bloque
});
db.carrera_clase_bloque.hasMany(db.detalle_periodo, {
    foreignKey: 'id_ccb',  // El campo en carrera_clase_bloque que hace referencia a detalle_periodo
    sourceKey: 'id_ccb',   // La clave primaria de detalle_periodo
    as: 'detallePeriodos'  // Alias para referirse a detalle_periodo desde carrera_clase_bloque
});

// Periodos -< DetallePeriodo
db.detalle_periodo.belongsTo(db.periodos, { foreignKey: { name: 'id_periodo' } });
db.periodos.hasMany(db.detalle_periodo, { foreignKey: 'id_periodo', sourceKey: 'id_periodo' });


db.detalle_periodo.belongsTo(db.carrera_clase_bloque, {
    foreignKey: 'id_ccb',
    as: 'clase'
});
module.exports = db;