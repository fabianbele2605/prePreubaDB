import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { connection } from '../conexion_db.js';

// Construir la ruta del archivo CSV usando import.meta.url
const __filename = new URL(import.meta.url).pathname.replace(/^\/[A-Za-z]:\//, ''); // Eliminar barra inicial en Windows
const __dirname = path.dirname(__filename);

export async function cargarUsuariosAlaBaseDeDatos() {
  const rutaArchivo = path.resolve(__dirname, '../data/01_usuarios.csv');
  const usuarios = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(rutaArchivo)
      .pipe(csv())
      .on('data', (fila) => {
        usuarios.push([
          fila.id_usuario,
          fila.nombre_completo?.trim(),
          fila.identificacion,
          fila.correo,
          fila.telefono
        ]);
      })
      .on('end', async () => {
        try {
          await connection.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
              id_usuario INT PRIMARY KEY,
              nombre_completo VARCHAR(255) NOT NULL,
              identificacion VARCHAR(50),
              correo VARCHAR(255),
              telefono VARCHAR(20)
            )
          `);
          const sql = 'INSERT INTO usuarios (id_usuario, nombre_completo, identificacion, correo, telefono) VALUES ?';
          const [result] = await connection.query(sql, [usuarios]);
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