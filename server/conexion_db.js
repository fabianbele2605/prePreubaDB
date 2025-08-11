import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

// Configuración de la conexión a MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'sql5.freesqldatabase.com',
  user: process.env.DB_USER || 'sql5794614',
  database: process.env.DB_NAME || 'sql5794614',
  password: process.env.DB_PASSWORD || 'dTAGdMGFGx',
  port: process.env.DB_PORT || 3306
};

// Crear la conexión
async function connectDB() {
  try {
    const conn = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión exitosa a MySQL!');
    return conn;
  } catch (err) {
    console.error('❌ Error al conectar con la base de datos:', err.stack);
    process.exit(1);
  }
}

// Exportar la conexión como nombrada
export const connection = await connectDB();