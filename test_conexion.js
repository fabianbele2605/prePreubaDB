import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0
});

async function probarConexionConLaBaseDeDatos() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexión a la base de datos exitosa');
        console.log(`Conectado a: ${process.env.DB_NAME} como ${process.env.DB_USER}`);
        connection.release();
    } catch (error) {
        console.error('❌ Error al conectar con la base de datos:', error.message);
        console.error('Detalles:', error);
    }
}

probarConexionConLaBaseDeDatos();