import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 42280, // Usa el puerto de Railway
    waitForConnections: true,
    connectionLimit: 5, // Bajamos el límite para ser más eficientes en la nube
    queueLimit: 0,
    enableKeepAlive: true, // Mantiene la conexión activa
    keepAliveInitialDelay: 10000 
});

export default db;