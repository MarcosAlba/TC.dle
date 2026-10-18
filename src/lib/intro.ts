// Introducción de cada juego: se muestra una vez por día. Al tocar "Empezar"
// queda guardada en localStorage la fecha de hoy y no vuelve a aparecer hasta
// el próximo cambio de día. El script del head (inicio-pagina.ts) lee la misma
// clave para decidir qué se ve antes del primer pintado.
import { type Almacenamiento } from "./almacenamiento";
import { obtenerFechaLocal } from "./fechas";

export function introVista(almacenamiento: Almacenamiento, clave: string, fecha: string = obtenerFechaLocal()): boolean {
    try {
        return almacenamiento.getItem(clave) === fecha;
    } catch {
        return false;
    }
}

export function marcarIntroVista(almacenamiento: Almacenamiento, clave: string, fecha: string = obtenerFechaLocal()): void {
    try {
        almacenamiento.setItem(clave, fecha);
    } catch {
        // Si localStorage no está disponible, simplemente no se recuerda.
    }
}
