import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Creamos el pool usando la URL completa si está disponible, 
// de lo contrario usa las variables individuales.
const poolConfig = process.env.DATABASE_URL || {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 5,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
};

const db = mysql.createPool(poolConfig);

export default db;