import fs from 'fs';
import path, { resolve } from 'path';
import csv from 'csv-parser';
import { dbConfig } from '../conexion_db';


export async function cargarPrestamosAlaBaseDeDatos() {
    
    const rutaArchivo = path.resolve('server/data/03_prestamos.csv');
    const prestamos = [];

    return new Promise((resolve, reject) => {
        fs.createReadStream(rutaArchivo)
          .pipe(csv())
          .on("data", (fila) => {
             prestamos.push([
                fila.id_prestamo,
                fila.id_usuario,
                fila.fecha_prestamo,
                fila.fecha_devolucion,
                fila.estado
             ]);
          })
          .on('end', async () => {
            try {
                const sql = 'INSERT INTO prestamos (id_prestamos,id_usuario,isbn,fecha_prestamo,fecha_devolucion,estado)';
                const [result] = await dbConfig.query(sql, [prestamos]);

                console.log(`✅ Se insertaron ${result.affectedRows} prestamos.`);
                resolve(); 
            } catch (err) {
                console.error('❌ Error al insertar prestamos:', error.message);
                reject(error);
            }
          })
          .on('error', (err) => {
            console.error('❌ Error al leer el archivo CSV de prestamos:', err.message);
            reject(err);
          });
    });
}