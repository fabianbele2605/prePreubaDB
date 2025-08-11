import fs from 'fs';
import path, { resolve } from 'path';
import csv from 'csv-parser';
import { dbConfig } from '../conexion_db';




export async function cargarLibrosAlaBaseDeDatos() {
    
    const rutaArchivo = path.resolve('server/data/02_libros.csv');
    const libros = [];

    return new Promise((resolve, reject) => {
        fs.createReadStream(rutaArchivo)
           .pipe(csv())
           .on("data", (fila) => {
            libros.push([
                fila.isbn,
                fila.titulo.trim(),
                fila.anio_publicacion,
                fila.autor
            ]);
           })
           .on('end', async () => {
              try {
                const sql = 'INSERT INTO libros (isbn,titulo,anio_publicacion,autor) VALUES ?';
                const [result] = await dbConfig.query(sql, [libros]);

                console.log(`✅ Se insetaron ${result.affectedRows} libros.`);
                resolve();
              } catch (error) {
                console.error('❌ Error al insertar libros:', error.message);
                reject(error)
              }
           })
           .on('error', (err) => {
              console.error('❌ Error al leer el archivo CSV de libros:', err.message);
              reject(err)
           });
    });
}