import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { connection } from '../conexion_db.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rutaArchivo = path.resolve(__dirname, '..', 'data', '01_usuarios.csv');

export async function cargarUsuariosAlaBaseDeDatos() {
  const usuarios = [];

  return new Promise((resolve, reject) => {
    console.log('Ruta del archivo:', rutaArchivo); // Para depurar
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
          // Eliminar datos existentes (opción 1: TRUNCATE para reiniciar IDs, opción 2: DELETE para conservar IDs)
          await connection.query('TRUNCATE TABLE usuarios');
          // O, si prefieres no reiniciar los IDs: await connection.query('DELETE FROM usuarios');

          // Crear la tabla si no existe
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