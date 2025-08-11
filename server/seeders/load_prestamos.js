import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { connection } from '../conexion_db.js';

// Construir la ruta del archivo CSV usando import.meta.url
const __filename = new URL(import.meta.url).pathname.replace(/^\/[A-Za-z]:\//, '');
const __dirname = path.dirname(__filename);

export async function cargarPrestamosAlaBaseDeDatos() {
  const rutaArchivo = path.resolve(__dirname, '../data/03_prestamos.csv');
  const prestamos = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(rutaArchivo)
      .pipe(csv())
      .on('data', (fila) => {
        prestamos.push([
          fila.id_prestamo,
          fila.id_usuario,
          fila.isbn,
          fila.fecha_prestamo,
          fila.fecha_devolucion,
          fila.estado
        ]);
      })
      .on('end', async () => {
        try {
          await connection.query(`
            CREATE TABLE IF NOT EXISTS prestamos (
              id_prestamo INT PRIMARY KEY,
              id_usuario INT NOT NULL,
              isbn VARCHAR(20) NOT NULL,
              fecha_prestamo DATE NOT NULL,
              fecha_devolucion DATE,
              estado ENUM('prestado', 'devuelto', 'atrasado') NOT NULL
            )
          `);
          const sql = 'INSERT INTO prestamos (id_prestamo, id_usuario, isbn, fecha_prestamo, fecha_devolucion, estado) VALUES ?';
          const [result] = await connection.query(sql, [prestamos]);
          console.log(`✅ Se insertaron ${result.affectedRows} préstamos.`);
          resolve();
        } catch (error) {
          console.error('❌ Error al insertar préstamos:', error.message);
          reject(error);
        }
      })
      .on('error', (err) => {
        console.error('❌ Error al leer el archivo CSV de préstamos:', err.message);
        reject(err);
      });
  });
}