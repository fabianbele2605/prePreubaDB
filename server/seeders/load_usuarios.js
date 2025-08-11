/*cargar los usuarios de la base de datos*/
import fs from 'fs';
import path, { resolve } from 'path';
import csv from 'csv-parser';
import dbConfig from "../conexion_db"


export async function cargarUsuariosAlaBaseDeDatos() {
    
    const rutaArchivo = path.resolve('server/data/01_usuarios.csv');
    const usuarios = [];

    return new Promise((resolve, reject) => {
        fs.createReadStream(rutaArchivo)
           .pipe(csv())
           .on("data", (fila) => {
            usuarios.push([
                fila.id_usuario,
                fila.nombre_completo.trim(),
                fila.identificacion,
                fila.correo,
                fila.telefono
            ]);
           })
           .on("end", async() => {
              try {
                const sql = 'INSERT INTO usuario (id_usuario,nombre_completo,identificacion,correo,telefono) VALUES ?';
                const [result] = await dbConfig.query(sql, [usuarios]);

                console.log(`✅ Se insertaron ${result.affectedRows} autores.`);
                resolve(); // termina exitosamente
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