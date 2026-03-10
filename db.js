// =============================================
// db.js — Conexión a MySQL
// =============================================
const mysql = require('mysql2/promise');
require('dotenv').config();

// Crear el pool de conexiones (permite múltiples consultas a la vez)
const pool = mysql.createPool({
    host:     process.env.DB_HOST,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
});

// Verificar conexión al arrancar el servidor
pool.getConnection()
    .then(conn => {
        console.log('✅ Conectado a MySQL correctamente');
        conn.release();
    })
    .catch(err => {
        console.error('❌ Error al conectar a MySQL:', err.message);
        console.error('   Verifica los datos en el archivo .env');
    });

module.exports = pool;
