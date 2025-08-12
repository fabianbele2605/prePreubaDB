// seed_all.js
import dotenv from "dotenv";
import { cargarUsuariosAlaBaseDeDatos } from "./server/seeders/load_usuarios.js";
import { cargarLibrosAlaBaseDeDatos } from "./server/seeders/load_libros.js";
import { cargarPrestamosAlaBaseDeDatos } from "./server/seeders/load_prestamos.js";
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

async function limpiarTablas() {
    try {
        await pool.query('SET FOREIGN_KEY_CHECKS = 0');
        await pool.query('TRUNCATE TABLE prestamos');
        await pool.query('TRUNCATE TABLE libros');
        await pool.query('TRUNCATE TABLE usuarios');
        await pool.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✅ Tablas limpiadas.');
    } catch (error) {
        console.error('❌ Error al limpiar tablas:', error.message);
        throw error;
    }
}

(async () => {
    try {
        console.log('🚀 Iniciando carga de datos...');
        await limpiarTablas();
        await cargarUsuariosAlaBaseDeDatos();
        console.log('✅ Carga de usuarios completada.');
        try {
            await cargarLibrosAlaBaseDeDatos();
            console.log('✅ Carga de libros completada.');
        } catch (error) {
            console.warn('⚠️ Continuando a pesar del error en libros:', error.message);
        }
        try {
            await cargarPrestamosAlaBaseDeDatos();
            console.log('✅ Carga de préstamos completada.');
        } catch (error) {
            console.warn('⚠️ Error en préstamos, pero continuando:', error.message);
        }
    } catch (error) {
        console.error('❌ Error crítico al cargar datos:', error.message);
        console.error('Detalles:', error);
    } finally {
        await pool.end();
        console.log('🔌 Conexión a la base de datos cerrada.');
        process.exit();
    }
})();