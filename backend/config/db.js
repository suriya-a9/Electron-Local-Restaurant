const { Pool } = require("pg");
require("dotenv").config();
const config = require("./default.js");
const logger = require("../logger");

const pool = new Pool({
    user: config.db_user,
    host: config.db_host,
    database: config.db_name,
    password: config.db_password,
    port: config.db_port,
});

pool.connect()
    .then(() => logger.info("PostgreSQL Connected"))
    .catch(err => logger.error("Connection Error:", err));

module.exports = pool;