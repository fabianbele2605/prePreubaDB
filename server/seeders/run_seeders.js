/*se encargara de llamar al load*/
import { cargarUsuariosAlaBaseDeDatos } from "./load_usuarios";
import { cargarLibrosAlaBaseDeDatos } from "./load_libros";
import { cargarPrestamosAlaBaseDeDatos } from "./load_prestamos";

(async () => {
    try {
        console.log('🚀 Iniciando seeders...');

        await cargarUsuariosAlaBaseDeDatos()
        await cargarLibrosAlaBaseDeDatos()
        await cargarPrestamosAlaBaseDeDatos()

        console.log('✅ Todos los seeders ejecutados correctamente.');
    } catch (error) {
        console.error('❌ Error ejecutando los seeders:', error.message);
    } finally {
        process.exit();
    }
})()