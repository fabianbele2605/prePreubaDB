import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { pool } from "../conexion_db.js";

export async function cargarUsuariosAlaBaseDeDatos() {
    const rutaArchivo = path.resolve('server/data/01_usuarios.csv');
    const usuarios = [];

    return new Promise((resolve, reject) => {
        fs.createReadStream(rutaArchivo)
            .pipe(csv())
            .on("data", (fila) => {
                usuarios.push([
                    fila.nombre ? fila.nombre.trim() : fila.nombre_completo.trim(), // Soporta ambos nombres
                    fila.identificacion,
                    fila.correo || null,
                    fila.telefono || null
                ]);
            })
            .on('end', async () => {
                try {
                    const sql = 'INSERT INTO usuarios (nombre, identificacion, correo, telefono) VALUES ?';
                    const [result] = await pool.query(sql, [usuarios]);
                    console.log(`✅ Se insertaron ${result.affectedRows} usuarios.`);
                    resolve();
                } catch (error) {
                    console.error('❌ Error al insertar usuarios:', error.message);
                    reject(error);
                }
            })
            .on('error', (err) => {
                console.error('❌ Error al leer el archivo CSV de usuarios:', err.message);
                reject(err);
            });
    });
}