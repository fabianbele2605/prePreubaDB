import { cargarUsuariosAlaBaseDeDatos } from "./server/seeders/load_usuarios.js";

(async () => {
    try {
        console.log('🚀 Iniciando carga de usuarios...');
        await cargarUsuariosAlaBaseDeDatos();
        console.log('✅ Carga de usuarios completada.');
    } catch (error) {
        console.error('❌ Error al cargar usuarios:', error.message);
    } finally {
        process.exit();
    }
})();