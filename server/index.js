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
               u.nombre_completo AS usuarios,
               
            `)
    }
})