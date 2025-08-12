import { cargarPrestamosAlaBaseDeDatos } from "./server/seeders/load_prestamos";

(async () => {
    try {
        console.log('🚀 Iniciando carga de prestamos...');
        await cargarPrestamosAlaBaseDeDatos();
        console.log('✅ Carga de prestamoos completada.');
    } catch (error) {
        console.error('❌ Error al cargar prestamos:', error.message);
        console.error('Detalles:', error);
    } finally {
        process.exit();
    }
})();