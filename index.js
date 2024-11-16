'use strict'

const db = require('./app/config/db');
const App = require('./app/app');
require('dotenv').config()

db.sequelizeInstance.sync().then(() => {
    console.info("Synced");
})
/*eslint-disable no-undef*/
App.listen(parseInt(process.env.APP_PORT), function (error) {
    if (error) return console.error(error);
    console.info(`server running on port: ${process.env.APP_PORT}`);
});
/*eslint-enable no-undef*/