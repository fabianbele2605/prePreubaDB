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

    // Iniciar una transacción
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Desactivar AUTO_INCREMENT temporalmente
        await connection.query('SET SESSION sql_mode = "NO_AUTO_VALUE_ON_ZERO"');
        console.log('✅ Modo NO_AUTO_VALUE_ON_ZERO activado.');

        // Insertar manualmente un usuario con id_usuario = 0
        await connection.query(
            'INSERT INTO usuarios (id_usuario, nombre, identificacion, correo, telefono) VALUES (?, ?, ?, ?, ?)',
            [0, 'Test Usuario Cero', 'ID000', 'test0@ejemplo.com', '1234567890']
        );
        console.log('✅ Usuario con id_usuario = 0 insertado manualmente.');

        // Verificar que el usuario se insertó
        const [rows] = await connection.query('SELECT id_usuario FROM usuarios WHERE id_usuario = ?', [0]);
        console.log('📄 Resultado de la verificación:', JSON.stringify(rows));
        if (rows.length === 0) {
            throw new Error('No se encontró id_usuario = 0 después de la inserción.');
        }
        console.log('✅ Verificado: id_usuario = 0 existe en la tabla usuarios.');

        const usuarios = [];

        // Cargar el resto de los usuarios desde el CSV
        await new Promise((resolve, reject) => {
            fs.createReadStream(rutaArchivo)
                .pipe(csv({ strict: true, skipLines: 0 }))
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
                            const [result] = await connection.query(sql, [usuarios]);
                            console.log(`✅ Se insertaron ${result.affectedRows} usuarios desde CSV.`);
                        } else {
                            console.log('⚠️ No se encontraron usuarios válidos en el CSV.');
                        }
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

        // Restaurar AUTO_INCREMENT
        await connection.query('ALTER TABLE usuarios AUTO_INCREMENT = 1');
        console.log('✅ AUTO_INCREMENT de usuarios ajustado a 1.');

        // Confirmar transacción
        await connection.commit();
        console.log('✅ Transacción de usuarios confirmada.');
    } catch (error) {
        await connection.rollback();
        console.error('❌ Error en la carga de usuarios, transacción revertida:', error.message);
        console.error('Detalles:', error);
        throw error;
    } finally {
        await connection.query('SET SESSION sql_mode = ""');
        connection.release();
    }
}