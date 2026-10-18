import { type Almacenamiento } from "./almacenamiento";
import { obtenerFechaLocal } from "./fechas";

interface ConfiguracionDatoDiario {
    almacenamiento: Almacenamiento;
    clave: string;
    fecha?: string;
}

/**
 * Guarda un dato suelto del día (por ejemplo la respuesta de la ronda extra
 * del año) como { fecha, valor }. El valor se descarta solo cuando cambia la fecha.
 */
export function crearDatoDiario<T = unknown>(configuracion: ConfiguracionDatoDiario) {
    const { almacenamiento, clave } = configuracion;
    const fecha = configuracion.fecha || obtenerFechaLocal();

    function leer(): T | null {
        try {
            const contenido = almacenamiento.getItem(clave);
            const guardado = contenido ? JSON.parse(contenido) : null;

            return guardado && guardado.fecha === fecha ? (guardado.valor as T) : null;
        } catch {
            return null;
        }
    }

    function guardar(valor: T): void {
        try {
            almacenamiento.setItem(clave, JSON.stringify({ fecha, valor }));
        } catch {
            // Sin almacenamiento el dato vive solo hasta recargar la página.
        }
    }

    function limpiar(): void {
        try {
            almacenamiento.removeItem(clave);
        } catch {
            // Nada que limpiar si el almacenamiento no está disponible.
        }
    }

    return { leer, guardar, limpiar };
}
