// Rachas: cuántos días seguidos se acertó cada juego. Se guardan en
// "rachasTCdle" como { piloto: { fecha, racha }, ... }.
import { leerJson, type Almacenamiento } from "./almacenamiento";
import { obtenerFechaAnterior, obtenerFechaLocal } from "./fechas";
import { JUEGOS, type Juego, type JuegoId } from "./juegos";

export const CLAVE_RACHAS = "rachasTCdle";

type Rachas = Partial<Record<JuegoId, { fecha: string; racha: number }>>;

export type EstadoJuego = "acertado" | "fallado" | "pendiente";

export interface JuegoConEstado extends Juego {
    estado: EstadoJuego;
    racha: number;
}

/**
 * La racha sube uno por cada día seguido acertado y vuelve a cero al
 * perder. Se registra una sola vez por día, aunque la partida se cargue
 * varias veces.
 */
export function registrarResultadoRacha(
    almacenamiento: Almacenamiento,
    clavePartida: string,
    fecha: string,
    acerto: boolean
): void {
    const juego = JUEGOS.find((item) => item.clavePartida === clavePartida);
    if (!juego) {
        return;
    }

    const rachas = leerJson<Rachas>(almacenamiento, CLAVE_RACHAS) ?? {};
    const anterior = rachas[juego.id];
    if (anterior && anterior.fecha === fecha) {
        return;
    }

    const continua = anterior && anterior.fecha === obtenerFechaAnterior(fecha);
    rachas[juego.id] = {
        fecha,
        racha: acerto ? (continua ? anterior.racha : 0) + 1 : 0,
    };

    try {
        almacenamiento.setItem(CLAVE_RACHAS, JSON.stringify(rachas));
    } catch {
        // Sin almacenamiento no hay racha que recordar.
    }
}

/** Racha vigente: si el último resultado no es de hoy ni de ayer, se saltó un día y se cortó. */
export function obtenerRacha(
    almacenamiento: Almacenamiento,
    juegoId: JuegoId,
    fecha: string = obtenerFechaLocal()
): number {
    const registro = (leerJson<Rachas>(almacenamiento, CLAVE_RACHAS) ?? {})[juegoId];

    if (!registro || (registro.fecha !== fecha && registro.fecha !== obtenerFechaAnterior(fecha))) {
        return 0;
    }

    return registro.racha || 0;
}

interface PartidaGuardada {
    fecha: string;
    objetivoId: unknown;
    idsIntentados: unknown[];
    terminada: boolean;
}

/** "acertado", "fallado" o "pendiente" según la partida guardada de hoy. */
export function obtenerEstadoJuego(
    almacenamiento: Almacenamiento,
    juego: Juego,
    fecha: string = obtenerFechaLocal()
): EstadoJuego {
    const partida = leerJson<PartidaGuardada>(almacenamiento, juego.clavePartida);

    if (!partida || partida.fecha !== fecha || !partida.terminada || !Array.isArray(partida.idsIntentados)) {
        return "pendiente";
    }

    return partida.idsIntentados.includes(partida.objetivoId) ? "acertado" : "fallado";
}

export function obtenerEstadoJuegos(
    almacenamiento: Almacenamiento,
    fecha: string = obtenerFechaLocal()
): JuegoConEstado[] {
    return JUEGOS.map((juego) => ({
        ...juego,
        estado: obtenerEstadoJuego(almacenamiento, juego, fecha),
        racha: obtenerRacha(almacenamiento, juego.id, fecha),
    }));
}

/** Primer juego pendiente después del actual, dando la vuelta a la lista. */
export function obtenerSiguienteJuego(juegoActualId: JuegoId, juegos: JuegoConEstado[]): JuegoConEstado | null {
    const indice = juegos.findIndex((juego) => juego.id === juegoActualId);

    for (let paso = 1; paso <= juegos.length; paso++) {
        const juego = juegos[(indice + paso) % juegos.length];
        if (juego.id !== juegoActualId && juego.estado === "pendiente") {
            return juego;
        }
    }

    return null;
}

export function contarPendientes(juegoActualId: JuegoId, juegos: JuegoConEstado[]): number {
    return juegos.filter((juego) => juego.id !== juegoActualId && juego.estado === "pendiente").length;
}
