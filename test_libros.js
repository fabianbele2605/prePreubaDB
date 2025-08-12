import { cargarLibrosAlaBaseDeDatos } from "./server/seeders/load_libros";

(async () => {
    try {
        console.log('🚀 Iniciando carga de libros...');
        await cargarLibrosAlaBaseDeDatos();
        console.log('✅ Carga de libros completada.');
    } catch (error) {
        console.error('❌ Error al cargar libros:', error.message);
        console.error('Detalles:', error);
    } finally {
        process.exit();
    }
})();