// server/seeders/load_usuarios.js
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { pool } from "../conexion_db.js";

export async function cargarUsuariosAlaBaseDeDatos() {
    const rutaArchivo = path.resolve('server/data/01_usuarios.csv');
    
    // Verificar si el archivo existe
    if (!fs.existsSync(rutaArchivo)) {
        throw new Error(`El archivo ${rutaArchivo} no existe.`);
    }
    console.log(`📂 Leyendo archivo: ${rutaArchivo}`);

    // Insertar manualmente un usuario con id_usuario = 0
    try {
        await pool.query(
            'INSERT INTO usuarios (id_usuario, nombre, identificacion, correo, telefono) VALUES (?, ?, ?, ?, ?)',
            [0, 'Test Usuario Cero', 'ID000', 'test0@ejemplo.com', '1234567890']
        );
        console.log('✅ Usuario con id_usuario = 0 insertado manualmente.');
    } catch (error) {
        console.error('❌ Error al insertar usuario con id = 0:', error.message);
        throw error;
    }

    const usuarios = [];

    // Cargar el resto de los usuarios desde el CSV
    return new Promise((resolve, reject) => {
        fs.createReadStream(rutaArchivo)
            .pipe(csv())
            .on("data", (fila) => {
                console.log('📄 Fila leída:', JSON.stringify(fila));
                usuarios.push([
                    fila.nombre ? fila.nombre.trim() : fila.nombre_completo.trim(),
                    fila.identificacion ? fila.identificacion.trim() : null,
                    fila.correo || null,
                    fila.telefono || null
                ]);
            })
            .on('end', async () => {
                try {
                    if (usuarios.length > 0) {
                        const sql = 'INSERT INTO usuarios (nombre, identificacion, correo, telefono) VALUES ?';
                        const [result] = await pool.query(sql, [usuarios]);
                        console.log(`✅ Se insertaron ${result.affectedRows} usuarios desde CSV.`);
                    } else {
                        console.log('⚠️ No se encontraron usuarios válidos en el CSV.');
                    }
                    // Ajustar AUTO_INCREMENT
                    await pool.query('ALTER TABLE usuarios AUTO_INCREMENT = 1');
                    console.log('✅ AUTO_INCREMENT de usuarios ajustado a 1.');
                    resolve();
                } catch (error) {
                    console.error('❌ Error al insertar usuarios desde CSV:', error.message);
                    reject(error);
                }
            })
            .on('error', (err) => {
                console.error('❌ Error al leer el archivo CSV de usuarios:', err.message);
                reject(err);
            });
    });
}