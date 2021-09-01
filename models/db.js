const { DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME, link, key, fromMail, fromName } = require("../config");
const mysql = require("mysql");

// Create a connection to the database
const connection = mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    insecureAuth: true,
});

// open the MySQL connection
connection.connect((error) => {
    if (error) throw error;
    console.log("Successfully connected to the database.");
});

module.exports = connection;
