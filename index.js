'use strict'

const db = require('./app/config/db');
const CONFIG = require('./app/config/config');
const App = require('./app/app');
require('dotenv').config()

db.sequelizeInstance.sync().then(() => {
    console.info("Synced");
})

App.listen(parseInt(process.env.APP_PORT), function (error) {
    if (error) return console.error(error);
    console.info(`server running on port: ${process.env.APP_PORT}`);
});