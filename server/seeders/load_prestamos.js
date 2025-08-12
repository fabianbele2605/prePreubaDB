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

    // Iniciar una transacción
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Activar NO_AUTO_VALUE_ON_ZERO
        await connection.query('SET SESSION sql_mode = "NO_AUTO_VALUE_ON_ZERO"');
        console.log('✅ Modo NO_AUTO_VALUE_ON_ZERO activado.');

        // Verificar que id_usuario = 0 y isbn = '978-0-13-079650-9' existan
        const [usuarios] = await connection.query('SELECT id_usuario FROM usuarios WHERE id_usuario = ?', [0]);
        console.log('📄 Resultado de la verificación de usuarios:', JSON.stringify(usuarios));
        if (usuarios.length === 0) {
            throw new Error('El id_usuario = 0 no existe en la tabla usuarios.');
        }
        console.log('✅ Verificado: id_usuario = 0 existe en la tabla usuarios.');

        const [libros] = await connection.query('SELECT isbn FROM libros WHERE isbn = ?', ['978-0-13-079650-9']);
        console.log('📄 Resultado de la verificación de libros:', JSON.stringify(libros));
        if (libros.length === 0) {
            throw new Error('El isbn = 978-0-13-079650-9 no existe en la tabla libros.');
        }
        console.log('✅ Verificado: isbn = 978-0-13-079650-9 existe en la tabla libros.');

        // Insertar manualmente un préstamo con id_prestamo = 0
        try {
            await connection.query(
                'INSERT INTO prestamos (id_prestamo, id_usuario, isbn, fecha_prestamo, estado) VALUES (?, ?, ?, ?, ?)',
                [0, 0, '978-0-13-079650-9', '2025-08-11', 'activo']
            );
            console.log('✅ Préstamo con id_prestamo = 0 insertado manualmente.');

            // Verificar que el préstamo se insertó
            const [prestamo] = await connection.query('SELECT id_prestamo FROM prestamos WHERE id_prestamo = ?', [0]);
            console.log('📄 Resultado de la verificación de préstamo:', JSON.stringify(prestamo));
            if (prestamo.length === 0) {
                console.warn('⚠️ No se encontró id_prestamo = 0 después de la inserción, continuando con el CSV.');
            } else {
                console.log('✅ Verificado: id_prestamo = 0 existe en la tabla prestamos.');
            }
        } catch (error) {
            console.warn('⚠️ Error al insertar o verificar id_prestamo = 0:', error.message);
            console.warn('⚠️ Continuando con la carga del CSV a pesar del error.');
        }

        // Cargar el resto de los préstamos desde el CSV
        await new Promise((resolve, reject) => {
            fs.createReadStream(rutaArchivo)
                .pipe(csv({ separator: ';', strict: true, skipLines: 0 }))
                .on("data", (fila) => {
                    console.log('📄 Fila parseada:', JSON.stringify(fila));
                    console.log('📄 Claves de la fila:', Object.keys(fila));
                    
                    // Limpiar y validar los campos
                    const estado = fila.estado?.trim() === 'devuelto' ? 'entregado' : fila.estado?.trim();
                    const id_usuario = parseInt(fila.id_usuario?.trim());
                    const isbn = fila.isbn?.trim();
                    const fecha_prestamo = fila.fecha_prestamo?.trim().replace(/\r|\n/g, ''); // Eliminar \r y \n
                    // --- CAMBIO AQUI: TRATAR 'fecha_devolucion' como nula si está vacía ---
                    const fecha_devolucion_str = fila.fecha_devolucion?.trim().replace(/\r|\n/g, '');
                    const fecha_devolucion = fecha_devolucion_str === '' ? null : fecha_devolucion_str;

                    // Depuración detallada
                    console.log('📄 Validación:');
                    console.log(`  - id_usuario: ${id_usuario}, válido: ${!isNaN(id_usuario)}`);
                    console.log(`  - isbn: ${isbn}, válido: ${isbn && isbn.length > 0}`);
                    console.log(`  - fecha_prestamo: ${fecha_prestamo}, válido: ${fecha_prestamo && fecha_prestamo.match(/^\d{4}-\d{2}-\d{2}$/)}`);
                    console.log(`  - estado: ${estado}, válido: ${estado && ['activo', 'entregado', 'retrasado'].includes(estado)}`);
                    console.log(`  - fecha_devolucion: ${fecha_devolucion}, válido: ${!fecha_devolucion || fecha_devolucion.match(/^\d{4}-\d{2}-\d{2}$/)}`);
                    console.log(`  - Caracteres en fecha_prestamo: ${JSON.stringify(fecha_prestamo?.split('').map(c => c.charCodeAt(0)))}`);

                    // Validar que los campos requeridos existan
                    const esFechaDevolucionValida = !fecha_devolucion || fecha_devolucion.match(/^\d{4}-\d{2}-\d{2}$/);
                    const esFechaDevolucionRequerida = estado === 'entregado' || estado === 'retrasado';

                    // --- CAMBIO AQUI: NUEVA LOGICA DE VALIDACION ---
                    if (
                        !isNaN(id_usuario) &&
                        isbn && isbn.length > 0 &&
                        fecha_prestamo && fecha_prestamo.match(/^\d{4}-\d{2}-\d{2}$/) &&
                        estado && ['activo', 'entregado', 'retrasado'].includes(estado) &&
                        (esFechaDevolucionRequerida ? fecha_devolucion !== null && esFechaDevolucionValida : true)
                    ) {
                        prestamos.push([id_usuario, isbn, fecha_prestamo, fecha_devolucion, estado]);
                    } else {
                        console.warn(`⚠️ Fila ignorada en el CSV: datos incompletos o no válidos - ${JSON.stringify(fila)}`);
                    }
                })
                .on('end', async () => {
                    try {
                        if (prestamos.length > 0) {
                            // Verificar que todos los id_usuario e isbn existan
                            const validPrestamos = [];
                            for (const prestamo of prestamos) {
                                const [id_usuario, isbn] = prestamo;
                                const [usuarios] = await connection.query('SELECT id_usuario FROM usuarios WHERE id_usuario = ?', [id_usuario]);
                                if (usuarios.length === 0) {
                                    console.warn(`⚠️ id_usuario = ${id_usuario} no existe en la tabla usuarios. Fila ignorada.`);
                                    continue;
                                }
                                const [libros] = await connection.query('SELECT isbn FROM libros WHERE isbn = ?', [isbn]);
                                if (libros.length === 0) {
                                    console.warn(`⚠️ isbn = ${isbn} no existe en la tabla libros. Fila ignorada.`);
                                    continue;
                                }
                                validPrestamos.push(prestamo);
                            }

                            if (validPrestamos.length > 0) {
                                const sql = 'INSERT INTO prestamos (id_usuario, isbn, fecha_prestamo, fecha_devolucion, estado) VALUES ?';
                                const [result] = await connection.query(sql, [validPrestamos]);
                                console.log(`✅ Se insertaron ${result.affectedRows} préstamos desde CSV.`);
                            } else {
                                console.log('⚠️ No se encontraron préstamos válidos en el CSV después de la validación.');
                            }
                        } else {
                            console.log('⚠️ No se encontraron préstamos válidos en el CSV.');
                        }
                        await connection.commit();
                        console.log('✅ Transacción de préstamos confirmada.');
                        resolve();
                    } catch (error) {
                        await connection.rollback();
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

        // Ajustar AUTO_INCREMENT
        await connection.query('ALTER TABLE prestamos AUTO_INCREMENT = 1');
        console.log('✅ AUTO_INCREMENT de préstamos ajustado a 1.');
    } catch (error) {
        await connection.rollback();
        console.error('❌ Error en la carga de préstamos, transacción revertida:', error.message);
        throw error;
    } finally {
        await connection.query('SET SESSION sql_mode = ""');
        connection.release();
    }
}