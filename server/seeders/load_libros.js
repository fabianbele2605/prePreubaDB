// server/seeders/load_libros.js
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { pool } from "../conexion_db.js";

export async function cargarLibrosAlaBaseDeDatos() {
    const rutaArchivo = path.resolve('server/data/02_libros.csv');
    
    // Verificar si el archivo existe
    if (!fs.existsSync(rutaArchivo)) {
        throw new Error(`El archivo ${rutaArchivo} no existe.`);
    }
    console.log(`📂 Leyendo archivo: ${rutaArchivo}`);

    const libros = [];

    // Iniciar una transacción
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        return new Promise((resolve, reject) => {
            fs.createReadStream(rutaArchivo)
                .pipe(csv({ strict: true, skipLines: 0 }))
                .on("data", (fila) => {
                    console.log('📄 Fila leída:', JSON.stringify(fila));
                    
                    // Normalizar isbn, eliminando espacios y verificando que no sea vacío
                    const isbn = fila.isbn ? String(fila.isbn).trim().replace(/\s+/g, '') : null;
                    if (isbn && isbn.length > 0) {
                        libros.push([
                            isbn,
                            fila.titulo ? String(fila.titulo).trim() : 'Título desconocido',
                            fila.anio_de_publicacion ? parseInt(fila.anio_de_publicacion) || null : null,
                            fila.autor ? String(fila.autor).trim() : null
                        ]);
                    } else {
                        console.warn(`⚠️ Fila ignorada en el CSV: isbn vacío o no válido - ${JSON.stringify(fila)}`);
                    }
                })
                .on('end', async () => {
                    try {
                        console.log(`📄 Leídos ${libros.length} libros válidos desde el CSV.`);
                        if (libros.length > 0) {
                            const sql = 'INSERT INTO libros (isbn, titulo, anio_de_publicacion, autor) VALUES ?';
                            const [result] = await connection.query(sql, [libros]);
                            console.log(`✅ Se insertaron ${result.affectedRows} libros.`);
                            
                            // Verificar que el isbn necesario para prestamos existe
                            const [isbnCheck] = await connection.query('SELECT isbn FROM libros WHERE isbn = ?', ['978-0-13-079650-9']);
                            console.log('📄 Resultado de la verificación de isbn:', JSON.stringify(isbnCheck));
                            if (isbnCheck.length === 0) {
                                throw new Error('El isbn = 978-0-13-079650-9 no se insertó en la tabla libros.');
                            }
                            console.log('✅ Verificado: isbn = 978-0-13-079650-9 existe en la tabla libros.');
                        } else {
                            console.warn('⚠️ No se encontraron libros válidos en el CSV.');
                        }
                        await connection.commit();
                        console.log('✅ Transacción de libros confirmada.');
                        resolve();
                    } catch (error) {
                        await connection.rollback();
                        console.error('❌ Error al insertar libros, transacción revertida:', error.message);
                        console.error('Detalles:', error);
                        reject(error);
                    }
                })
                .on('error', (err) => {
                    console.error('❌ Error al leer el archivo CSV de libros:', err.message);
                    reject(err);
                });
        });
    } catch (error) {
        await connection.rollback();
        console.error('❌ Error en la carga de libros, transacción revertida:', error.message);
        throw error;
    } finally {
        connection.release();
    }
}