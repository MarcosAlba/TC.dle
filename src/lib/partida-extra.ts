// Partida de Campaña, Grilla y Conexiones. Cada una tiene su propio estado, pero
// se guarda en la clave de partida del juego (JUEGOS) con los mismos campos que
// leen la portada, las pestañas y las rachas: fecha, terminada, gano e intentos.
// El estado completo del juego va aparte, en "estado".
import type { Almacenamiento } from "./almacenamiento";
import { claveDelDia, type DiaJuego } from "./dia-juego";
import { obtenerJuego, type JuegoId } from "./juegos";
import { registrarResultadoRacha } from "./rachas";

export interface ResumenPartidaExtra {
    terminada: boolean;
    gano: boolean;
    /** Lo que se probó, en orden: con al menos uno la portada lo muestra "en curso". */
    intentos: unknown[];
}

export function crearPartidaExtra<T>(almacenamiento: Almacenamiento, juego: JuegoId, dia: DiaJuego) {
    // Un día del archivo usa otra clave ("…Archivo"): no pisa la partida de hoy ni suma a la racha.
    const clave = claveDelDia(obtenerJuego(juego).clavePartida, dia);

    function leer(): T | null {
        try {
            const guardado = JSON.parse(almacenamiento.getItem(clave) ?? "null");
            return guardado?.version === 1 && guardado.fecha === dia.fecha ? (guardado.estado as T) : null;
        } catch {
            return null;
        }
    }

    function guardar(estado: T, resumen: ResumenPartidaExtra): void {
        try {
            almacenamiento.setItem(
                clave,
                JSON.stringify({ version: 1, fecha: dia.fecha, terminada: resumen.terminada, gano: resumen.gano, intentos: resumen.intentos, estado })
            );
        } catch {
            // Sin almacenamiento la partida dura hasta recargar la página.
        }
        // Se registra una sola vez por día aunque se llame de nuevo al cargar.
        if (resumen.terminada) {
            registrarResultadoRacha(almacenamiento, clave, dia.fecha, resumen.gano);
        }
    }

    return { leer, guardar };
}
