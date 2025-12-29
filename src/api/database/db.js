import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();
console.log("Intentando conectar a:", process.env.DB_HOST, "en el puerto:", process.env.DB_PORT);
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    // Estabilidad para Railway:
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
});

export default db;