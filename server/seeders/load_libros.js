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

    return new Promise((resolve, reject) => {
        fs.createReadStream(rutaArchivo)
            .pipe(csv())
            .on("data", (fila) => {
                // Depurar el contenido de la fila
                console.log('📄 Fila leída:', JSON.stringify(fila));
                
                // Normalizar isbn, eliminando espacios y verificando que no sea vacío
                const isbn = fila.isbn ? fila.isbn.trim() : null;
                if (isbn) {
                    libros.push([
                        isbn,
                        fila.titulo ? fila.titulo.trim() : 'Título desconocido',
                        fila.anio_de_publicacion ? parseInt(fila.anio_de_publicacion) || null : null,
                        fila.autor ? fila.autor.trim() : null
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
                        const [result] = await pool.query(sql, [libros]);
                        console.log(`✅ Se insertaron ${result.affectedRows} libros.`);
                    } else {
                        console.warn('⚠️ No se encontraron libros válidos en el CSV.');
                    }
                    resolve();
                } catch (error) {
                    console.error('❌ Error al insertar libros:', error.message);
                    console.error('Detalles:', error);
                    reject(error);
                }
            })
            .on('error', (err) => {
                console.error('❌ Error al leer el archivo CSV de libros:', err.message);
                reject(err);
            });
    });
}