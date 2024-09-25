'use strict'

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const App = express();

App.use(cors())
App.use(express.json());
App.use(express.urlencoded({ extended: false }));

//TODO: put every controller here. const test = requires('./routes/test')
const roleRoutes = require('./routes/roleRoutes');
const usuarioRoutes = require('./routes/userRoutes');
const facultadRoutes = require('./routes/facultadRoutes');
const docenteRoutes = require('./routes/docenteRoutes');
const alumnoRoutes = require('./routes/alumnoRoutes');
const documentacionRoutes = require('./routes/documentacionRoutes');
const detalleDocumentacionRoutes = require('./routes/detalleDocumentacionRoutes');
const documentoRoutes = require('./routes/docenteRoutes');
const ternaRoutes = require('./routes/ternaRoutes');
const detalleTernaRoutes = require('./routes/detalleTernaRoutes');

//TODO: Put every route file here. App.use('api/test', test);
App.use('/api/role', roleRoutes);
App.use('/api/user', usuarioRoutes);
App.use('/api/facultad', facultadRoutes);
App.use('/api/docente', docenteRoutes);
App.use('/api/alumno', alumnoRoutes);
App.use('/api/documentacion', documentacionRoutes);
App.use('/api/detalleDocumentacion', detalleDocumentacionRoutes);
App.use('/api/documentos', documentoRoutes);
App.use('/api/ternas', ternaRoutes);
App.use('/api/detalleTernas', detalleTernaRoutes);

module.exports = App;
