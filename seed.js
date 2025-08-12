import { cargarUsuariosAlaBaseDeDatos } from "./server/seeders/load_usuarios.js";
import { cargarLibrosAlaBaseDeDatos } from "./server/seeders/load_libros.js";
import { cargarPrestamosAlaBaseDeDatos } from "./server/seeders/load_prestamos.js";

(async () => {
    try {
        console.log('🚀 Iniciando seeders...');
        await cargarUsuariosAlaBaseDeDatos();
        await cargarLibrosAlaBaseDeDatos();
        await cargarPrestamosAlaBaseDeDatos();
        console.log('✅ Todos los seeders ejecutados correctamente.');
    } catch (error) {
        console.error('❌ Error ejecutando los seeders:', error.message);
    } finally {
        process.exit();
    }
})();