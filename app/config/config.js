'use strict'

module.exports = {
    PORT: process.env.PORT || 3300,
    HOST: process.env.DB || '127.0.0.1',
    DB: 'sakila',
    USER: 'acalixvasquez',
    PASSWORD: '0Unicah2024?',
    DIALECT: 'mysql',
    POOL_MAX: 5,
    POOL_MIN: 0,
    POOL_ACQUIRE: 30000,
    POOL_IDLE: 10000,
    SECRET_TOKEN: 'unicah2024sap',
    // API_TOKEN: '',
    // PRIVATE_KEY: '',
    // CLIENT_EMAIL: '',
}