const mysql = require('mysql2/promise');
const config = require('../config/config');

const db = mysql.createPool({
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    waitForConnections: true,
    connectionLimit: config.db.connectionLimit,
});

if (config.db.debug) {
    const originalQuery = db.query.bind(db);
    db.query = async function (sql, params) {
        console.log('\x1b[33m%s\x1b[0m', `------------------------------------------------------------`);
        console.log('\x1b[33m%s\x1b[0m', `[SQL QUERY]`);
        console.log('\x1b[33m%s\x1b[0m', `Query: ${sql}`);
        if (params) console.log('\x1b[33m%s\x1b[0m', `Params: ${JSON.stringify(params)}`);
        console.log('\x1b[33m%s\x1b[0m', `------------------------------------------------------------`);
        return originalQuery(sql, params);
    };

    const originalExecute = db.execute.bind(db);
    db.execute = async function (sql, params) {
        console.log('\x1b[33m%s\x1b[0m', `------------------------------------------------------------`);
        console.log('\x1b[33m%s\x1b[0m', `[SQL EXECUTE]`);
        console.log('\x1b[33m%s\x1b[0m', `Query: ${sql}`);
        if (params) console.log('\x1b[33m%s\x1b[0m', `Params: ${JSON.stringify(params)}`);
        console.log('\x1b[33m%s\x1b[0m', `------------------------------------------------------------`);
        return originalExecute(sql, params);
    };
}

module.exports = db;
