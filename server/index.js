import express from 'express';
import cors from 'cors';
import { dbConfig } from './conexion_db';

const app = express();
app.use(cors());
app.use(express.json());


app.get('/prestamos', async (req, res) => {
    try {
        const [rows] = await dbConfig.query(`
            SELECT
                p.id_prestamo,
                p.fecha_prestamo,
                p.fecha_devolucion,
                p.estado,
                u.nombre_completo AS usuario,
                l.isbn,
                l.titulo AS libro
            FROM prestamos p
            LETF JOIN usuarios u ON p.id_usuario = u.id_usuario
            LETF JOIN libros l ON p.isbn = l.isbn
            `);

            res.json(rows);

    } catch (error) {
        res.status(500).json({
            status: 'error',
            endpoint: req.originalUrl,
            method: req.method,
            message: error.message
        });
    }
});

app.get('/prestamos/:id_prestamo', async (req, res) => {
    try {
        const { id_prestamo } = req.params

        const {rows} = await dbConfig.query(`
            SELECT
               p.id_prestamo,
               p.fecha_prestamo,
               p.fecha_devolucion,
               p.estado,
               u.nombre_completo AS usuario,
               l.isbn,
               l.titulo AS libro
            FROM prestamos p
            LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
            LEFT JOIN libros l ON p.isbn = l.isbn WHERE p.id_prestamo = ?
            `, [id_prestamo]);

            res.json(rows[0]);
    } catch (error) {
        res.status(500).json({
            status: 'error',
            endpoint: req.originalUrl,
            method: req.method,
            message: error.message
        });
    }
});

app.post('/prestamos', async (req, res) => {
    try {
        const {
            id_usuario,
            isbn,
            fecha_prestamo,
            fecha_devolucion,
            estado
        } = req.body

        const query = `
        INSERT INTO prestamos
        (id_usuario, isbn, fecha_prestamo, fecha_devolucion, estado)
        VALUES (?,?,?,?,?)
        `

        const values = [
            id_usuario,
            isbn,
            fecha_prestamo,
            fecha_devolucion,
            estado
        ]

        const [result] = await dbConfig.query(query, values)

        res.status(201).json({
            mensaje: "prestamo creado exitosamente!"
        })
    } catch (error) {
        res.status(500).json({
            status: 'error',
            endpoint: req.originalUrl,
            method: req.method,
            message: error.message
        })
    }
})