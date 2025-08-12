import cors from "cors";
import express from "express";
import { pool } from "./conexion_db.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get('/prestamos', async (req, res) => {
    try {
        const [rows] = await pool.query(`
        SELECT 
            p.id_prestamo,
            p.fecha_prestamo,
            p.fecha_devolucion,
            p.estado,
            u.nombre AS usuario,
            l.isbn, 
            l.titulo AS libro
        FROM prestamos p
        LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
        LEFT JOIN libros l ON p.isbn = l.isbn
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
        const { id_prestamo } = req.params;
        const [rows] = await pool.query(`
        SELECT 
            p.id_prestamo,
            p.fecha_prestamo,
            p.fecha_devolucion,
            p.estado,
            u.nombre AS usuario,
            l.isbn, 
            l.titulo AS libro
        FROM prestamos p
        LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
        LEFT JOIN libros l ON p.isbn = l.isbn
        WHERE p.id_prestamo = ?
        `, [id_prestamo]);
        res.json(rows[0] || {});
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
        const { id_usuario, isbn, fecha_prestamo, fecha_devolucion, estado } = req.body;
        const query = `
        INSERT INTO prestamos 
        (id_usuario, isbn, fecha_prestamo, fecha_devolucion, estado)
        VALUES (?, ?, ?, ?, ?)
        `;
        const values = [id_usuario, isbn, fecha_prestamo, fecha_devolucion || null, estado];
        const [result] = await pool.query(query, values);
        res.status(201).json({ mensaje: "Préstamo creado exitosamente" });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            endpoint: req.originalUrl,
            method: req.method,
            message: error.message
        });
    }
});

app.put('/prestamos/:id_prestamo', async (req, res) => {
    try {
        const { id_prestamo } = req.params;
        const { id_usuario, isbn, fecha_prestamo, fecha_devolucion, estado } = req.body;
        const query = `
        UPDATE prestamos SET 
            id_usuario = ?,
            isbn = ?,
            fecha_prestamo = ?,
            fecha_devolucion = ?,
            estado = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id_prestamo = ?
        `;
        const values = [id_usuario, isbn, fecha_prestamo, fecha_devolucion || null, estado, id_prestamo];
        const [result] = await pool.query(query, values);
        if (result.affectedRows > 0) {
            return res.json({ mensaje: "Préstamo actualizado" });
        }
        res.status(404).json({ mensaje: "Préstamo no encontrado" });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            endpoint: req.originalUrl,
            method: req.method,
            message: error.message
        });
    }
});

app.delete('/prestamos/:id_prestamo', async (req, res) => {
    try {
        const { id_prestamo } = req.params;
        const query = `DELETE FROM prestamos WHERE id_prestamo = ?`;
        const [result] = await pool.query(query, [id_prestamo]);
        if (result.affectedRows > 0) {
            return res.json({ mensaje: "Préstamo eliminado" });
        }
        res.status(404).json({ mensaje: "Préstamo no encontrado" });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            endpoint: req.originalUrl,
            method: req.method,
            message: error.message
        });
    }
});

app.get('/prestamos/usuario/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(`
            SELECT 
                p.id_prestamo,
                p.fecha_prestamo,
                p.fecha_devolucion,
                p.estado,
                l.isbn,
                l.titulo AS libro
            FROM prestamos p
            LEFT JOIN libros l ON p.isbn = l.isbn
            WHERE p.id_usuario = ?
        `, [id]);
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

app.get('/libros/mas-prestados', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                l.isbn,
                l.titulo,
                COUNT(p.id_prestamo) AS total_prestamos
            FROM prestamos p
            LEFT JOIN libros l ON p.isbn = l.isbn
            GROUP BY l.isbn, l.titulo
            ORDER BY total_prestamos DESC
            LIMIT 5
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

app.get('/usuarios/con-retrasos', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT DISTINCT
                u.id_usuario,
                u.nombre AS usuario
            FROM prestamos p
            LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
            WHERE p.estado = 'retrasado'
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

app.get('/prestamos/activos', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                p.id_prestamo,
                p.fecha_prestamo,
                p.fecha_devolucion,
                p.estado,
                u.nombre AS usuario,
                l.titulo AS libro
            FROM prestamos p
            LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
            LEFT JOIN libros l ON p.isbn = l.isbn
            WHERE p.estado = 'activo'
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

app.get('/prestamos/historial/:isbn', async (req, res) => {
    try {
        const { isbn } = req.params;
        const [rows] = await pool.query(`
            SELECT 
                p.id_prestamo,
                p.fecha_prestamo,
                p.fecha_devolucion,
                p.estado,
                u.nombre AS usuario
            FROM prestamos p
            LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
            WHERE p.isbn = ?
            ORDER BY p.fecha_prestamo DESC
        `, [isbn]);
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

app.listen(3000, () => {
    console.log("Servidor preparado correctamente en http://localhost:3000");
});