import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { connection } from '../conexion_db.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rutaArchivo = path.resolve(__dirname, '..', 'data', '02_libros.csv');

export async function cargarLibrosAlaBaseDeDatos() {
  const libros = [];

  return new Promise((resolve, reject) => {
    console.log('Ruta del archivo:', rutaArchivo); // Para depurar
    fs.createReadStream(rutaArchivo)
      .pipe(csv())
      .on('data', (fila) => {
        libros.push([
          fila.isbn,
          fila.titulo?.trim(),
          fila.anio_publicacion,
          fila.autor
        ]);
      })
      .on('end', async () => {
        try {
          await connection.query(`
            CREATE TABLE IF NOT EXISTS libros (
              isbn VARCHAR(20) PRIMARY KEY,
              titulo VARCHAR(255) NOT NULL,
              anio_publicacion YEAR,
              autor VARCHAR(255) NOT NULL
            )
          `);
          const sql = 'INSERT INTO libros (isbn, titulo, anio_publicacion, autor) VALUES ?';
          const [result] = await connection.query(sql, [libros]);
          console.log(`✅ Se insertaron ${result.affectedRows} libros.`);
          resolve();
        } catch (error) {
          console.error('❌ Error al insertar libros:', error.message);
          reject(error);
        }
      })
      .on('error', (err) => {
        console.error('❌ Error al leer el archivo CSV de libros:', err.message);
        reject(err);
      });
  });
}