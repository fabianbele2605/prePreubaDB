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

    // Verificar que id_usuario = 0 y isbn = '978-0-13-079650-9' existan
    try {
        const [usuarios] = await pool.query('SELECT id_usuario FROM usuarios WHERE id_usuario = ?', [0]);
        if (usuarios.length === 0) {
            throw new Error('El id_usuario = 0 no existe en la tabla usuarios.');
        }
        console.log('✅ Verificado: id_usuario = 0 existe en la tabla usuarios.');
        
        const [libros] = await pool.query('SELECT isbn FROM libros WHERE isbn = ?', ['978-0-13-079650-9']);
        if (libros.length === 0) {
            throw new Error('El isbn = 978-0-13-079650-9 no existe en la tabla libros.');
        }
        console.log('✅ Verificado: isbn = 978-0-13-079650-9 existe en la tabla libros.');

        // Insertar manualmente un préstamo con id_prestamo = 0
        await pool.query(
            'INSERT INTO prestamos (id_prestamo, id_usuario, isbn, fecha_prestamo, estado) VALUES (?, ?, ?, ?, ?)',
            [0, 0, '978-0-13-079650-9', '2025-08-11', 'activo']
        );
        console.log('✅ Préstamo con id_prestamo = 0 insertado manualmente.');
    } catch (error) {
        console.error('❌ Error al insertar o verificar préstamo con id = 0:', error.message);
        throw error;
    }

    // Cargar el resto de los préstamos desde el CSV
    return new Promise((resolve, reject) => {
        fs.createReadStream(rutaArchivo)
            .pipe(csv({ strict: true, skipLines: 0 }))
            .on("data", (fila) => {
                console.log('📄 Fila leída:', JSON.stringify(fila));
                const estado = fila.estado === 'devuelto' ? 'entregado' : fila.estado;
                if (fila.id_usuario && fila.isbn && fila.fecha_prestamo) {
                    prestamos.push([
                        fila.id_usuario,
                        fila.isbn,
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
                        const sql = 'INSERT INTO prestamos (id_usuario, isbn, fecha_prestamo, fecha_devolucion, estado) VALUES ?';
                        const [result] = await pool.query(sql, [prestamos]);
                        console.log(`✅ Se insertaron ${result.affectedRows} préstamos desde CSV.`);
                    } else {
                        console.log('⚠️ No se encontraron préstamos válidos en el CSV.');
                    }
                    // Ajustar AUTO_INCREMENT
                    await pool.query('ALTER TABLE prestamos AUTO_INCREMENT = 1');
                    console.log('✅ AUTO_INCREMENT de préstamos ajustado a 1.');
                    resolve();
                } catch (error) {
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
}