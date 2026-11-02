// Qué día se juega: hoy, o uno anterior del archivo con ?dia=AAAA-MM-DD en la
// dirección. Los días del archivo se guardan en otra clave (la de siempre más
// "Archivo"), así no pisan la partida de hoy ni suman a la racha: las rachas
// solo reconocen las claves de JUEGOS.
import { leerJson, type Almacenamiento } from "./almacenamiento";
import { obtenerFechaLocal } from "./fechas";
import { FECHA_LANZAMIENTO } from "./dia";
import type { JuegoId } from "./juegos";

export interface DiaJuego {
    /** "AAAA-MM-DD" del día que se juega. */
    fecha: string;
    /** Ese día a la medianoche local, para la selección diaria. */
    fechaSeleccion: Date;
    /** true si es un día anterior (?dia= válido). */
    esArchivo: boolean;
}

const aFecha = (texto: string) => {
    const [anio, mes, dia] = texto.split("-").map(Number);
    return new Date(anio, mes - 1, dia);
};

/** El día pedido en la dirección si es válido (desde el lanzamiento hasta ayer); si no, hoy. */
export function leerDiaJuego(busqueda: string, hoy: Date = new Date()): DiaJuego {
    const pedido = new URLSearchParams(busqueda).get("dia");
    const fechaHoy = obtenerFechaLocal(hoy);

    if (pedido && /^\d{4}-\d{2}-\d{2}$/.test(pedido) && obtenerFechaLocal(aFecha(pedido)) === pedido) {
        if (pedido >= FECHA_LANZAMIENTO && pedido < fechaHoy) {
            return { fecha: pedido, fechaSeleccion: aFecha(pedido), esArchivo: true };
        }
    }

    return { fecha: fechaHoy, fechaSeleccion: aFecha(fechaHoy), esArchivo: false };
}

/** Clave de guardado de la partida para ese día. */
export const claveDelDia = (clave: string, dia: DiaJuego): string => (dia.esArchivo ? clave + "Archivo" : clave);

/** Link a un juego en un día del archivo (o a hoy, sin parámetro). */
export const conDia = (url: string, dia: DiaJuego): string => (dia.esArchivo ? url + "?dia=" + dia.fecha : url);

// ---------- Historial: cómo terminó cada juego cada día, para el calendario del archivo ----------

export const CLAVE_HISTORIAL = "tcdleHistorial";

export type ResultadoHistorial = "acertado" | "fallado";

type Historial = Record<string, Partial<Record<JuegoId, ResultadoHistorial>>>;

/** true si es la primera vez que se registra ese juego ese día (la partida se terminó recién). */
export function registrarHistorial(almacenamiento: Almacenamiento, fecha: string, juego: JuegoId, gano: boolean): boolean {
    const historial = leerJson<Historial>(almacenamiento, CLAVE_HISTORIAL) ?? {};
    const nuevo = !historial[fecha]?.[juego];
    historial[fecha] = { ...historial[fecha], [juego]: gano ? "acertado" : "fallado" };

    try {
        almacenamiento.setItem(CLAVE_HISTORIAL, JSON.stringify(historial));
    } catch {
        // Sin almacenamiento el calendario queda sin marcas.
    }

    return nuevo;
}

export function leerHistorial(almacenamiento: Almacenamiento): Historial {
    return leerJson<Historial>(almacenamiento, CLAVE_HISTORIAL) ?? {};
}
