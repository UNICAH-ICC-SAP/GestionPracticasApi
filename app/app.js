'use strict'

const express = require('express');
const cors = require('cors');
const App = express();

App.use(
    cors({
        origin: "*",// Reemplaza con el dominio correcto
    })
);

App.use(cors())
App.use(express.json({ limit: '50mb' }));
App.use(express.urlencoded({ extended: false, limit: '50mb' }));

//TODO: put every controller here. const test = requires('./routes/test')
const roleRoutes = require('./routes/roleRoutes');
const usuarioRoutes = require('./routes/userRoutes');
const facultadRoutes = require('./routes/facultadRoutes');
const docenteRoutes = require('./routes/docenteRoutes');
const alumnoRoutes = require('./routes/alumnoRoutes');
const ternaRoutes = require('./routes/ternaRoutes');
const detalleTernaRoutes = require('./routes/detalleTernaRoutes');
const pensumRoutes = require('./routes/pensumRoutes');
const periodoRoutes = require('./routes/periodoRoutes');
const seccionesRoutes = require('./routes/seccionesRoutes');
const clasesDocenteRoutes = require('./routes/clasesDocentesRoutes');
const correoRoutes = require('./routes/enviarCorreoRoutes');
const plantillaAccionRoutes = require('./routes/plantillaAccionRoutes');
const userPermissionRoutes = require('./routes/userPermissionRoutes')
const rolePermissionRoutes = require('./routes/rolePermissionsRoutes')
const fileRoutes = require('./routes/fileRoutes');


//TODO: Put every route file here. App.use('api/test', test);
App.use('/api/role', roleRoutes);
App.use('/api/user', usuarioRoutes);
App.use('/api/facultad', facultadRoutes);
App.use('/api/docente', docenteRoutes);
App.use('/api/alumno', alumnoRoutes);
App.use('/api/ternas', ternaRoutes);
App.use('/api/detalleTernas', detalleTernaRoutes);
App.use('/api/pensum', pensumRoutes);
App.use('/api/periodo', periodoRoutes);
App.use('/api/plantillaAccion', plantillaAccionRoutes);
App.use('/api/secciones', seccionesRoutes);
App.use('/api/clasesDocentes', clasesDocenteRoutes);
App.use('/api/correo', correoRoutes);
App.use('/api/userPermission', userPermissionRoutes);
App.use('/api/rolePermission', rolePermissionRoutes);
App.use('/api/files', fileRoutes);

module.exports = App;
