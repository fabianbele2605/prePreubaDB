// server/seeders/load_prestamos.js
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { pool } from "../conexion_db.js";

export async function cargarPrestamosAlaBaseDeDatos() {
    const rutaArchivo = path.resolve('server/data/03_prestamos.csv');
    
    // Verificar si el archivo existe
    if (!fs.existsSync(rutaArchivo)) {
        throw new Error(`El archivo ${rutaArchivo} no existe.`);
    }
    console.log(`📂 Leyendo archivo: ${rutaArchivo}`);

    const prestamos = [];

    // Iniciar una transacción
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Verificar que id_usuario = 0 y isbn = '978-0-13-079650-9' existan
        const [usuarios] = await connection.query('SELECT id_usuario FROM usuarios WHERE id_usuario = ?', [0]);
        console.log('📄 Resultado de la verificación de usuarios:', JSON.stringify(usuarios));
        if (usuarios.length === 0) {
            throw new Error('El id_usuario = 0 no existe en la tabla usuarios.');
        }
        console.log('✅ Verificado: id_usuario = 0 existe en la tabla usuarios.');

        const [libros] = await connection.query('SELECT isbn FROM libros WHERE isbn = ?', ['978-0-13-079650-9']);
        console.log('📄 Resultado de la verificación de libros:', JSON.stringify(libros));
        if (libros.length === 0) {
            throw new Error('El isbn = 978-0-13-079650-9 no existe en la tabla libros.');
        }
        console.log('✅ Verificado: isbn = 978-0-13-079650-9 existe en la tabla libros.');

        // Insertar manualmente un préstamo con id_prestamo = 0
        await connection.query(
            'INSERT INTO prestamos (id_prestamo, id_usuario, isbn, fecha_prestamo, estado) VALUES (?, ?, ?, ?, ?)',
            [0, 0, '978-0-13-079650-9', '2025-08-11', 'activo']
        );
        console.log('✅ Préstamo con id_prestamo = 0 insertado manualmente.');

        // Verificar que el préstamo se insertó
        const [prestamo] = await connection.query('SELECT id_prestamo FROM prestamos WHERE id_prestamo = ?', [0]);
        console.log('📄 Resultado de la verificación de préstamo:', JSON.stringify(prestamo));
        if (prestamo.length === 0) {
            throw new Error('No se encontró id_prestamo = 0 después de la inserción.');
        }
        console.log('✅ Verificado: id_prestamo = 0 existe en la tabla prestamos.');

        // Cargar el resto de los préstamos desde el CSV
        await new Promise((resolve, reject) => {
            fs.createReadStream(rutaArchivo)
                .pipe(csv({ strict: true, skipLines: 0 }))
                .on("data", (fila) => {
                    console.log('📄 Fila leída:', JSON.stringify(fila));
                    const estado = fila.estado === 'devuelto' ? 'entregado' : fila.estado;
                    if (fila.id_usuario && fila.isbn && fila.fecha_prestamo) {
                        prestamos.push([
                            parseInt(fila.id_usuario),
                            fila.isbn.trim(),
                            fila.fecha_prestamo,
                            fila.fecha_devolucion || null,
                            estado
                        ]);
                    } else {
                        console.warn(`⚠️ Fila ignorada en el CSV: datos incompletos - ${JSON.stringify(fila)}`);
                    }
                })
                .on('end', async () => {
                    try {
                        if (prestamos.length > 0) {
                            // Verificar que todos los id_usuario e isbn existan
                            for (const prestamo of prestamos) {
                                const [usuarios] = await connection.query('SELECT id_usuario FROM usuarios WHERE id_usuario = ?', [prestamo[0]]);
                                if (usuarios.length === 0) {
                                    console.warn(`⚠️ id_usuario = ${prestamo[0]} no existe en la tabla usuarios. Fila ignorada.`);
                                    continue;
                                }
                                const [libros] = await connection.query('SELECT isbn FROM libros WHERE isbn = ?', [prestamo[1]]);
                                if (libros.length === 0) {
                                    console.warn(`⚠️ isbn = ${prestamo[1]} no existe en la tabla libros. Fila ignorada.`);
                                    continue;
                                }
                            }

                            const sql = 'INSERT INTO prestamos (id_usuario, isbn, fecha_prestamo, fecha_devolucion, estado) VALUES ?';
                            const [result] = await connection.query(sql, [prestamos]);
                            console.log(`✅ Se insertaron ${result.affectedRows} préstamos desde CSV.`);
                        } else {
                            console.log('⚠️ No se encontraron préstamos válidos en el CSV.');
                        }
                        await connection.commit();
                        console.log('✅ Transacción de préstamos confirmada.');
                        resolve();
                    } catch (error) {
                        await connection.rollback();
                        console.error('❌ Error al insertar préstamos desde CSV:', error.message);
                        console.error('Detalles:', error);
                        reject(error);
                    }
                })
                .on('error', (err) => {
                    console.error('❌ Error al leer el archivo CSV de préstamos:', err.message);
                    reject(err);
                });
        });

        // Ajustar AUTO_INCREMENT
        await connection.query('ALTER TABLE prestamos AUTO_INCREMENT = 1');
        console.log('✅ AUTO_INCREMENT de préstamos ajustado a 1.');
    } catch (error) {
        await connection.rollback();
        console.error('❌ Error en la carga de préstamos, transacción revertida:', error.message);
        throw error;
    } finally {
        connection.release();
    }
}