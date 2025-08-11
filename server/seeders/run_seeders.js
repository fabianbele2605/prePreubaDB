import { cargarUsuariosAlaBaseDeDatos } from './load_usuarios.js';
import { cargarLibrosAlaBaseDeDatos } from './load_libros.js';
import { cargarPrestamosAlaBaseDeDatos } from './load_prestamos.js';

async function runSeeders() {
  console.log('🚀 Iniciando seeders...');
  try {
    await cargarUsuariosAlaBaseDeDatos(); // Primero usuarios
    await cargarLibrosAlaBaseDeDatos();   // Luego libros
    await cargarPrestamosAlaBaseDeDatos(); // Finalmente préstamos
    console.log('✅ Seeders ejecutados correctamente');
  } catch (error) {
    console.error('❌ Error ejecutando los seeders:', error.message);
  }
}

runSeeders();