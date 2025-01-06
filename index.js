'use strict'

const db = require('./app/config/db');
const App = require('./app/app');
require('dotenv').config()

/*eslint-disable no-undef*/
const PORT = process.env.PORT || process.env.APP_PORT;
/*eslint-enable no-undef*/

db.sequelizeInstance.sync()
    .then(() => {
        console.info("Synced");
        App.listen(parseInt(PORT), function (error) {
            if (error) return console.error(error);
            console.info(`server running on port: ${PORT}`);
        });
    })
    .catch(error => {
        console.error("Failed to sync database:", error);
    })
