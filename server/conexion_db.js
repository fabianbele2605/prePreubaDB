import dotenv from 'dotenv'
import mysql from 'mysql2/promise'


dotenv.config() 

// configuracion de la conexion a mysql
export const dbConfig = {
    host: 'sql5.freesqldatabase.com',
    user: 'sql5794456',
    database: 'sql5794456',
    password: 'TyTqswyG64',
    port: 3306
};

// crear la conexion
let connection;
async function connectDB() {
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Conexion exitosa a MySQL!');
    } catch (err) {
        console.error('Error al conectar con la base de datos:', err.stack);
        process.exit(1);
    }
}

// conectar base de datos
connectDB();
